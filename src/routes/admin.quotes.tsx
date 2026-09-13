import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuoteRequestsFn, createInvoiceFromQuoteFn } from "@/lib/admin/quotes.functions";
import { listProductsFn } from "@/lib/products/products.functions";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Receipt, 
  Plus, 
  Trash2, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Truck, 
  Sparkles,
  Share2,
  Calendar,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/admin/quotes")({
  component: AdminQuotesPage,
});

interface InvoiceItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  isCustom?: boolean;
}

interface QuoteRequest {
  id: string;
  created_at: string;
  type: string;
  contact_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  location: string;
  volume_estimated: string | null;
  products_requested: string | null;
  message: string | null;
  status: "pending" | "processed";
  order_id: string | null;
}

function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getQuoteTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case "wholesale":
    case "grossiste":
      return { label: "Vente en gros", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" };
    case "distributor":
    case "distributeur":
      return { label: "Distribution", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" };
    case "catering":
    case "horeca":
      return { label: "Horeca / Resto", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" };
    case "event":
    case "evenement":
      return { label: "Événementiel", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" };
    default:
      return { label: type || "Standard", color: "bg-secondary text-secondary-foreground border-border" };
  }
}

function AdminQuotesPage() {
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [successInvoice, setSuccessInvoice] = useState<{
    orderId: string;
    orderNumber: string;
    paymentUrl: string;
    pdfUrl: string;
    clientName: string;
    phone: string;
    total: number;
    emailSent?: boolean;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "processed">("all");

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: () => getQuoteRequestsFn(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
  });

  // Formulaire de facturation
  const [invoiceForm, setInvoiceForm] = useState({
    shippingFee: 0,
    items: [] as InvoiceItem[],
  });

  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const createInvoice = useMutation({
    mutationFn: () => {
      if (!selectedQuote) throw new Error("Aucun devis sélectionné");
      const subtotal = invoiceForm.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
      return createInvoiceFromQuoteFn({
        data: {
          quoteId: selectedQuote.id,
          subtotal,
          shippingFee: Number(invoiceForm.shippingFee) || 0,
          items: invoiceForm.items.map(it => ({
            productId: it.productId,
            productName: it.productName,
            unitPrice: Number(it.unitPrice) || 0,
            quantity: Number(it.quantity) || 1,
          })),
        }
      });
    },
    onSuccess: (data) => {
      toast.success("Facture pro créée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      
      const clientName = selectedQuote?.contact_name || "";
      const phone = selectedQuote?.phone || "";
      const total = invoiceForm.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0) + (Number(invoiceForm.shippingFee) || 0);

      // Conserver les détails pour la modale de confirmation & partage
      setSuccessInvoice({
        orderId: data.orderId,
        orderNumber: data.orderNumber || "CMD-PRO",
        paymentUrl: data.paymentUrl,
        pdfUrl: data.pdfUrl || `/api/invoices/${data.orderId}.pdf`,
        clientName,
        phone,
        total,
        emailSent: data.emailSent,
      });

      setSelectedQuote(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erreur lors de la création de la facture");
    }
  });

  // Calculs statistiques
  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter((q: QuoteRequest) => q.status === "pending").length;
    const processed = quotes.filter((q: QuoteRequest) => q.status === "processed").length;
    return { total, pending, processed };
  }, [quotes]);

  // Filtrage des devis
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q: QuoteRequest) => {
      const matchesStatus = filterStatus === "all" ? true : q.status === filterStatus;
      const qLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !qLower || 
        q.contact_name?.toLowerCase().includes(qLower) ||
        q.company_name?.toLowerCase().includes(qLower) ||
        q.phone?.includes(qLower) ||
        q.email?.toLowerCase().includes(qLower) ||
        q.location?.toLowerCase().includes(qLower) ||
        q.products_requested?.toLowerCase().includes(qLower);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, filterStatus, searchQuery]);

  // Ajouter un produit à la facture
  const handleAddProduct = () => {
    if (!selectedProductId) return;

    if (selectedProductId === "custom") {
      setInvoiceForm(f => ({
        ...f,
        items: [
          ...f.items,
          {
            productId: `custom-${Date.now()}`,
            productName: "Produit sur mesure / spécial",
            unitPrice: 0,
            quantity: 1,
            isCustom: true,
          }
        ]
      }));
    } else {
      const prod = products.find(p => p.id === selectedProductId);
      if (!prod) return;

      // Chercher le prix CI par défaut ou premier prix
      const basePrice = prod.product_prices?.find(pr => pr.country_code === "CI")?.price 
        || prod.product_prices?.[0]?.price 
        || 0;

      setInvoiceForm(f => ({
        ...f,
        items: [
          ...f.items,
          {
            productId: prod.id,
            productName: prod.name,
            unitPrice: basePrice,
            quantity: 1,
            isCustom: false,
          }
        ]
      }));
    }

    setSelectedProductId("");
  };

  const openInvoiceModal = (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setInvoiceForm({
      shippingFee: 0,
      items: [],
    });
    setSelectedProductId("");
  };

  const subtotal = invoiceForm.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const totalToPay = subtotal + (Number(invoiceForm.shippingFee) || 0);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary tracking-tight">
            Demandes de devis & Facturation B2B
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les demandes de devis professionnels et générez directement des liens de paiement Paystack personnalisés.
          </p>
        </div>
      </div>

      {/* Cartes KPI / Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:border-gold/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Devis Reçus</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">En attente de traitement</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Facturés / Convertis</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.processed}</div>
          </div>
        </div>
      </div>

      {/* Barre de filtre & Recherche */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par client, entreprise, téléphone, produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-xl shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterStatus === "all"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterStatus === "pending"
                ? "bg-background text-amber-600 dark:text-amber-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus("processed")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterStatus === "processed"
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturés ({stats.processed})
          </button>
        </div>
      </div>

      {/* Liste des devis (Responsive Table Desktop + Cards Mobile) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Vue Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Client & Structure</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Type & Produits</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQuotes.map((q: QuoteRequest) => {
                const badge = getQuoteTypeBadge(q.type);
                return (
                  <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(new Date(q.created_at), "dd MMM yyyy", { locale: fr })}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(q.created_at), "HH:mm")}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        {q.contact_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{q.company_name || "Particulier / Indépendant"}</span>
                      </div>
                      {q.location && (
                        <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span>{q.location}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{q.phone}</span>
                        <a
                          href={`https://wa.me/${q.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contacter sur WhatsApp"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-xs"
                        >
                          WA
                        </a>
                      </div>
                      {q.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{q.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.color} mb-1`}>
                        {badge.label}
                      </span>
                      <div className="text-xs text-foreground font-medium truncate" title={q.products_requested || ""}>
                        {q.products_requested || "Non spécifié"}
                      </div>
                      {q.volume_estimated && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Package className="w-3 h-3 shrink-0" />
                          <span>Vol: {q.volume_estimated}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {q.status === "processed" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Facturé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          En attente
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {q.status === "pending" ? (
                        <button
                          onClick={() => openInvoiceModal(q)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold text-gold-foreground font-semibold text-xs shadow-sm hover:bg-gold/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Créer Facture
                        </button>
                      ) : q.order_id ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              const payUrl = `${window.location.origin}/pay/${q.order_id}?token=b2b_payment`;
                              navigator.clipboard.writeText(payUrl);
                              toast.success("Lien de paiement copié !");
                            }}
                            title="Copier le lien de paiement"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-all"
                          >
                            <Copy className="w-3 h-3 text-gold" />
                            Lien
                          </button>
                          <a
                            href={`https://wa.me/${q.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${q.contact_name}, voici votre lien de règlement Cereals House : ${window.location.origin}/pay/${q.order_id}?token=b2b_payment`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Renvoyer sur WhatsApp"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 text-xs font-semibold transition-all"
                          >
                            <Share2 className="w-3 h-3" />
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Facturé
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Vue Mobile (Cards élégantes) */}
        <div className="md:hidden divide-y divide-border">
          {filteredQuotes.map((q: QuoteRequest) => {
            const badge = getQuoteTypeBadge(q.type);
            return (
              <div key={q.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(q.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </span>
                    <h3 className="font-bold text-foreground text-base mt-0.5">{q.contact_name}</h3>
                    {q.company_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {q.company_name}
                      </p>
                    )}
                  </div>
                  <div>
                    {q.status === "processed" ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Facturé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-3 text-xs space-y-1.5 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type :</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Téléphone :</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{q.phone}</span>
                      <a
                        href={`https://wa.me/${q.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  {q.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lieu :</span>
                      <span>{q.location}</span>
                    </div>
                  )}
                  {q.products_requested && (
                    <div className="pt-1 border-t border-border">
                      <span className="text-muted-foreground block mb-0.5">Demande :</span>
                      <p className="font-medium text-foreground">{q.products_requested}</p>
                    </div>
                  )}
                  {q.message && (
                    <div className="pt-1 border-t border-border">
                      <span className="text-muted-foreground block mb-0.5">Message client :</span>
                      <p className="italic text-muted-foreground bg-background p-2 rounded border border-border">"{q.message}"</p>
                    </div>
                  )}
                </div>

                {q.status === "pending" ? (
                  <button
                    onClick={() => openInvoiceModal(q)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold text-gold-foreground rounded-xl font-bold text-xs shadow-sm hover:bg-gold/90 transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    Créer la facture personnalisée
                  </button>
                ) : q.order_id ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        const payUrl = `${window.location.origin}/pay/${q.order_id}?token=b2b_payment`;
                        navigator.clipboard.writeText(payUrl);
                        toast.success("Lien de paiement copié !");
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium"
                    >
                      <Copy className="w-3.5 h-3.5 text-gold" />
                      Copier le lien
                    </button>
                    <a
                      href={`https://wa.me/${q.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Bonjour ${q.contact_name}, voici votre lien de règlement Cereals House : ${window.location.origin}/pay/${q.order_id}?token=b2b_payment`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* État vide */}
        {filteredQuotes.length === 0 && (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <FileText className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Aucune demande trouvée</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery
                ? "Aucun résultat ne correspond à votre recherche. Essayez d'autres mots-clés."
                : "Les nouvelles demandes de devis apparaîtront ici automatiquement."}
            </p>
          </div>
        )}
      </div>

      {/* MODAL : CRÉER UNE FACTURE PERSONNALISÉE (Ergonomique & Ultra-Responsive) */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
          {/* Header de la modale */}
          <div className="px-6 py-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-serif font-bold text-foreground">
                  Créer une facture pro
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Client : <span className="font-semibold text-foreground">{selectedQuote?.contact_name}</span>
                  {selectedQuote?.company_name && ` (${selectedQuote.company_name})`}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Corps de la modale avec Scrollbar verticale uniquement */}
          <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Colonne GAUCHE : Récapitulatif du devis (5 colonnes sur desktop) */}
              <div className="lg:col-span-5 bg-muted/30 border border-border rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold" />
                    Détails de la demande
                  </h4>
                  {selectedQuote && (
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${getQuoteTypeBadge(selectedQuote.type).color}`}>
                      {getQuoteTypeBadge(selectedQuote.type).label}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Client / Contact :</span>
                    <span className="font-semibold text-sm text-foreground">{selectedQuote?.contact_name}</span>
                    {selectedQuote?.company_name && (
                      <span className="block text-muted-foreground text-xs mt-0.5">{selectedQuote.company_name}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gold" />
                      Téléphone :
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{selectedQuote?.phone}</span>
                      <a
                        href={`https://wa.me/${selectedQuote?.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-bold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {selectedQuote?.email && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gold" />
                        Email :
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[160px]">{selectedQuote.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      Lieu / Ville :
                    </span>
                    <span className="font-medium text-foreground">{selectedQuote?.location || "-"}</span>
                  </div>

                  {selectedQuote?.volume_estimated && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gold" />
                        Volume estimé :
                      </span>
                      <span className="font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                        {selectedQuote.volume_estimated}
                      </span>
                    </div>
                  )}

                  {selectedQuote?.products_requested && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1">Articles / Produits demandés :</span>
                      <div className="p-2.5 bg-background rounded-xl border border-border text-foreground font-medium">
                        {selectedQuote.products_requested}
                      </div>
                    </div>
                  )}

                  {selectedQuote?.message && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-gold" />
                        Note ou instruction client :
                      </span>
                      <p className="p-2.5 bg-background rounded-xl border border-border text-muted-foreground italic text-xs leading-relaxed">
                        "{selectedQuote.message}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne DROITE : Lignes de facturation (7 colonnes sur desktop) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="border-b border-border pb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Articles & Tarification
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {invoiceForm.items.length} article(s)
                  </span>
                </div>

                {/* Sélecteur d'ajout de produit */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Ajouter un article à la facture :
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    >
                      <option value="">-- Choisir un produit du catalogue --</option>
                      <optgroup label="Produits disponibles">
                        {products.map((p) => {
                          const price = p.product_prices?.find(pr => pr.country_code === "CI")?.price || p.product_prices?.[0]?.price || 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatCFA(price)})
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Spécifique / Sur mesure">
                        <option value="custom">➕ Article sur-mesure / personnalisé</option>
                      </optgroup>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!selectedProductId}
                      className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Liste des articles ajoutés */}
                <div className="space-y-2.5">
                  {invoiceForm.items.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground bg-muted/10">
                      <Receipt className="w-8 h-8 opacity-30 mx-auto mb-2 text-muted-foreground" />
                      Aucun article ajouté pour le moment.
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        Sélectionnez un produit ci-dessus pour composer la facture du devis.
                      </p>
                    </div>
                  ) : (
                    invoiceForm.items.map((item, idx) => (
                      <div
                        key={item.productId + idx}
                        className="bg-card border border-border rounded-xl p-3 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {item.isCustom ? (
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => {
                                const newItems = [...invoiceForm.items];
                                newItems[idx].productName = e.target.value;
                                setInvoiceForm({ ...invoiceForm, items: newItems });
                              }}
                              placeholder="Nom de l'article sur mesure..."
                              className="flex-1 text-sm font-semibold bg-background border border-border rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-gold/50"
                            />
                          ) : (
                            <div className="font-semibold text-sm text-foreground flex-1 truncate">
                              {item.productName}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                              setInvoiceForm({ ...invoiceForm, items: newItems });
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Paramètres de la ligne : Quantité, Prix unitaire, Total ligne */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/50">
                          {/* Quantité */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Qté :</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                const newItems = [...invoiceForm.items];
                                newItems[idx].quantity = val;
                                setInvoiceForm({ ...invoiceForm, items: newItems });
                              }}
                              className="w-16 px-2 py-1 text-center font-medium bg-background border border-border rounded-lg"
                            />
                          </div>

                          {/* Prix Unitaire */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Prix unitaire :</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                const newItems = [...invoiceForm.items];
                                newItems[idx].unitPrice = val;
                                setInvoiceForm({ ...invoiceForm, items: newItems });
                              }}
                              className="w-24 px-2 py-1 text-right font-medium bg-background border border-border rounded-lg"
                            />
                            <span className="text-muted-foreground font-medium">FCFA</span>
                          </div>

                          {/* Total Ligne */}
                          <div className="font-bold text-foreground sm:ml-auto">
                            = {formatCFA(item.unitPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Frais de livraison avec presets rapides */}
                <div className="bg-muted/20 border border-border rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Truck className="w-4 h-4 text-gold" />
                      Frais de livraison :
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.shippingFee}
                        onChange={(e) => {
                          setInvoiceForm({
                            ...invoiceForm,
                            shippingFee: Math.max(0, parseFloat(e.target.value) || 0)
                          });
                        }}
                        className="w-28 px-3 py-1.5 text-right font-semibold text-sm bg-background border border-border rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground font-medium">FCFA</span>
                    </div>
                  </div>

                  {/* Boutons rapides pour la livraison */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    <span className="text-[11px] text-muted-foreground mr-1">Exemples :</span>
                    {[0, 1500, 2500, 3000, 5000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, shippingFee: fee })}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                          invoiceForm.shippingFee === fee
                            ? "bg-gold text-gold-foreground border-gold font-bold"
                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {fee === 0 ? "Gratuit" : `${fee.toLocaleString()} F`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif financier */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sous-total articles :</span>
                    <span className="font-medium text-foreground">{formatCFA(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Frais d'expédition :</span>
                    <span className="font-medium text-foreground">{formatCFA(Number(invoiceForm.shippingFee) || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Total à régler par le client :</span>
                    <span className="text-xl font-bold text-gold font-serif">
                      {formatCFA(totalToPay)}
                    </span>
                  </div>
                </div>

                {/* Bouton de validation */}
                <button
                  type="button"
                  onClick={() => createInvoice.mutate()}
                  disabled={createInvoice.isPending || invoiceForm.items.length === 0}
                  className="w-full py-3.5 bg-gold text-gold-foreground rounded-xl font-bold text-sm shadow-md hover:bg-gold/90 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {createInvoice.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Génération de la commande et du lien...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Générer la commande & le lien de paiement
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SUCCÈS & PARTAGE DIRECT */}
      <Dialog open={!!successInvoice} onOpenChange={(open) => !open && setSuccessInvoice(null)}>
        <DialogContent className="max-w-md w-[90vw] p-6 rounded-2xl bg-card border-border shadow-2xl">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <DialogTitle className="text-xl font-serif font-bold text-foreground">
                Facture pro générée !
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                La commande <span className="font-semibold text-foreground">{successInvoice?.orderNumber}</span> a été enregistrée avec succès.
              </DialogDescription>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client :</span>
                <span className="font-semibold">{successInvoice?.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant total :</span>
                <span className="font-bold text-gold">{formatCFA(successInvoice?.total || 0)}</span>
              </div>

              {successInvoice?.emailSent && (
                <div className="flex items-center gap-1.5 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Facture PDF envoyée automatiquement par email</span>
                </div>
              )}

              {/* Téléchargement direct PDF */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                  Facture PDF :
                </span>
                <a
                  href={successInvoice?.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Voir / Télécharger le PDF
                </a>
              </div>

              {/* Lien direct Paystack */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Lien Paystack direct :</span>
                <div className="flex items-center gap-2">
                  <a
                    href={successInvoice?.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    title="Accéder directement à Paystack"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ouvrir
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (successInvoice?.paymentUrl) {
                        navigator.clipboard.writeText(successInvoice.paymentUrl);
                        toast.success("Lien Paystack copié dans le presse-papier !");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    Copier
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={
                  successInvoice
                    ? `https://wa.me/${successInvoice.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Bonjour ${successInvoice.clientName}, Cereals House vous remercie pour votre confiance !\n\nVoici votre facture officielle ${successInvoice.orderNumber} d'un montant de ${formatCFA(successInvoice.total)}.\n\n📄 Votre facture en PDF à télécharger :\n${
                          successInvoice.pdfUrl.startsWith("http")
                            ? successInvoice.pdfUrl
                            : `${window.location.origin}${successInvoice.pdfUrl}`
                        }\n\n💳 Régler directement sur Paystack (Mobile Money / Carte) :\n${successInvoice.paymentUrl}\n\n${
                          successInvoice.emailSent
                            ? "Un email avec la facture PDF en pièce jointe vous a également été envoyé automatiquement.\n\n"
                            : ""
                        }Pour toute question, nous restons à votre entière disposition !`
                      )}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Envoyer par WhatsApp (Lien Paystack + PDF)
              </a>

              <button
                type="button"
                onClick={() => setSuccessInvoice(null)}
                className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
