/** Formulario bancario — validación local de formato; persistencia requiere API DoEventsBack (BACKEND_REQUIRED). */
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Building2, Smartphone, Loader2, Globe, ChevronRight, Upload, X, FileText, Wallet } from "lucide-react";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lovable/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@lovable/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@lovable/components/ui/form";
import { toast } from "@lovable/components/ui/sonner";
import SuccessModal from "./SuccessModal";

const documentTypes = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PP", label: "Pasaporte" },
];

const accountHolderRoles = [
  { value: "propietario", label: "Propietario/a" },
  { value: "director", label: "Director/a" },
  { value: "representante", label: "Representante Legal" },
  { value: "gerente", label: "Gerente" },
];

const countries = [
  { value: "CO", label: "Colombia" },
  { value: "US", label: "Estados Unidos" },
  { value: "MX", label: "México" },
  { value: "ES", label: "España" },
  { value: "DO", label: "República Dominicana" },
  { value: "PA", label: "Panamá" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "PE", label: "Perú" },
  { value: "EC", label: "Ecuador" },
];

const colombianBanks = [
  { value: "banco_bogota", label: "Banco de Bogotá" },
  { value: "banco_occidente", label: "Banco de Occidente" },
  { value: "banco_popular", label: "Banco Popular" },
  { value: "banco_agrario", label: "Banco Agrario" },
  { value: "davivienda", label: "Davivienda" },
  { value: "bbva", label: "BBVA Colombia" },
  { value: "scotiabank", label: "Scotiabank Colpatria" },
  { value: "itau", label: "Itaú" },
  { value: "banco_caja_social", label: "Banco Caja Social" },
  { value: "banco_av_villas", label: "Banco AV Villas" },
  { value: "banco_pichincha", label: "Banco Pichincha" },
  { value: "banco_gnb_sudameris", label: "Banco GNB Sudameris" },
  { value: "bancoomeva", label: "Bancoomeva" },
  { value: "banco_falabella", label: "Banco Falabella" },
  { value: "otro", label: "Otro banco" },
];

// Base schema for local accounts
const localAccountSchema = z.object({
  bank: z.enum(["bancolombia", "nequi", "otros"], {
    required_error: "Selecciona un banco",
  }),
  otherBankName: z.string().optional(),
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  documentType: z
    .string({
      required_error: "Selecciona el tipo de documento",
    })
    .min(1, "Selecciona el tipo de documento"),
  documentNumber: z
    .string()
    .min(5, "El número de documento debe tener al menos 5 dígitos")
    .max(15, "El número de documento no puede exceder 15 dígitos")
    .regex(/^\d+$/, "Solo se permiten números, sin puntos ni guiones"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Correo electrónico inválido",
  }),
  accountType: z.enum(["ahorros", "corriente", "deposito_electronico"], {
    required_error: "Selecciona el tipo de cuenta",
  }),
  accountNumber: z.string(),
  accountNumberConfirm: z.string().optional(),
  bankCertification: z.any().optional(),
}).refine(
  (data) => {
    const value = (data.accountNumber ?? "").trim();
    if (data.bank === "nequi") return /^\d{10}$/.test(value);
    if (data.bank === "bancolombia") return /^\d{7,11}$/.test(value);
    return /^\d{7,20}$/.test(value);
  },
  {
    message: "Número de cuenta inválido",
    path: ["accountNumber"],
  }
).refine((data) => {
  if (data.bank === "otros") {
    return data.otherBankName && data.otherBankName.length > 0;
  }
  return true;
}, {
  message: "Selecciona el banco",
  path: ["otherBankName"],
}).refine((data) => {
  if (data.bank === "otros") {
    return data.email && data.email.length > 0;
  }
  return true;
}, {
  message: "El correo electrónico es obligatorio",
  path: ["email"],
}).refine((data) => {
  if (data.bank === "otros") {
    return data.accountNumber === data.accountNumberConfirm;
  }
  return true;
}, {
  message: "Los números de cuenta no coinciden",
  path: ["accountNumberConfirm"],
});

// Schema for international accounts
const internationalAccountSchema = z.object({
  accountHolderType: z.enum(["personal", "empresarial"], {
    required_error: "Selecciona el tipo de cuenta",
  }),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  companyName: z.string().max(100).optional(),
  holderRole: z.string({
    required_error: "Esta información es obligatoria",
  }),
  swiftCode: z
    .string()
    .min(8, "El código SWIFT debe tener entre 8 y 11 caracteres")
    .max(11, "El código SWIFT debe tener entre 8 y 11 caracteres")
    .regex(/^[A-Z0-9]+$/, "Solo se permiten letras mayúsculas y números"),
  iban: z
    .string()
    .min(15, "El IBAN debe tener entre 15 y 34 caracteres")
    .max(34, "El IBAN debe tener entre 15 y 34 caracteres")
    .regex(/^[A-Z0-9]+$/, "No se permiten espacios"),
  ibanConfirm: z.string(),
  streetAddress: z.string().min(5, "La dirección es obligatoria").max(200),
  apartmentInfo: z.string().max(100).optional(),
  city: z.string().min(2, "El municipio es obligatorio").max(100),
  state: z.string().min(2, "El estado es obligatorio").max(100),
  postalCode: z.string().min(3, "El código postal es obligatorio").max(20),
  country: z.string({
    required_error: "Selecciona el país",
  }),
}).refine((data) => data.iban === data.ibanConfirm, {
  message: "Los números IBAN no coinciden",
  path: ["ibanConfirm"],
}).refine((data) => {
  // firstName y lastName solo son obligatorios para cuenta personal
  if (data.accountHolderType === "personal") {
    return data.firstName && data.firstName.length >= 2;
  }
  return true;
}, {
  message: "El nombre es obligatorio",
  path: ["firstName"],
}).refine((data) => {
  // companyName solo es obligatorio para cuenta empresarial
  if (data.accountHolderType === "empresarial") {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: "El nombre de la empresa es obligatorio",
  path: ["companyName"],
});

const paypalCurrencies = [
  { value: "USD", label: "USD - Dólar estadounidense" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Libra esterlina" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "COP", label: "COP - Peso colombiano" },
];

// Schema for PayPal accounts
const paypalAccountSchema = z.object({
  identifierType: z.enum(["email", "phone", "paypalId"], {
    required_error: "Selecciona el tipo de identificador",
  }),
  paypalEmail: z.string().max(255).optional(),
  paypalEmailConfirm: z.string().max(255).optional(),
  paypalPhone: z.string().max(20).optional(),
  paypalId: z.string().max(13).optional(),
  fullName: z
    .string()
    .min(3, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras"),
  paypalCurrency: z.string({ required_error: "Selecciona la divisa" }),
  paypalCountry: z.string({ required_error: "Selecciona el país" }),
}).refine((data) => {
  if (data.identifierType === "email") {
    return data.paypalEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.paypalEmail);
  }
  return true;
}, {
  message: "Ingresa un correo electrónico válido",
  path: ["paypalEmail"],
}).refine((data) => {
  if (data.identifierType === "email") {
    return data.paypalEmail === data.paypalEmailConfirm;
  }
  return true;
}, {
  message: "Los correos electrónicos no coinciden",
  path: ["paypalEmailConfirm"],
}).refine((data) => {
  if (data.identifierType === "phone") {
    return data.paypalPhone && /^\+\d{7,15}$/.test(data.paypalPhone);
  }
  return true;
}, {
  message: "Ingresa un número válido con código de país (ej: +573001234567)",
  path: ["paypalPhone"],
}).refine((data) => {
  if (data.identifierType === "paypalId") {
    return data.paypalId && /^[A-Z0-9]{13}$/.test(data.paypalId);
  }
  return true;
}, {
  message: "El ID de PayPal debe tener 13 caracteres alfanuméricos",
  path: ["paypalId"],
});

type LocalAccountData = z.infer<typeof localAccountSchema>;
type InternationalAccountData = z.infer<typeof internationalAccountSchema>;
type PaypalAccountData = z.infer<typeof paypalAccountSchema>;

type PaymentMethodType = "local" | "international" | "paypal" | null;

export interface SavedPaymentMethod {
  id: string;
  type: "bancolombia" | "nequi" | "otros" | "international" | "paypal";
  name: string;
  details: string;
  currency: "COP" | "USD" | "EUR" | "GBP" | "MXN";
  status: "active" | "pending" | "default";
}

interface BankingFormProps {
  onComplete?: (method?: SavedPaymentMethod) => void;
  editingMethod?: SavedPaymentMethod;
}

export default function BankingForm({ onComplete, editingMethod }: BankingFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    editingMethod ? (editingMethod.type === "international" ? "international" : editingMethod.type === "paypal" ? "paypal" : "local") : null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [swiftVerified, setSwiftVerified] = useState(false);
  const [swiftBankName, setSwiftBankName] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local account form
  const localForm = useForm<LocalAccountData>({
    resolver: zodResolver(localAccountSchema),
    defaultValues: {
      bank: undefined,
      fullName: "",
      documentType: "",
      documentNumber: "",
      email: "",
      accountType: undefined,
      accountNumber: "",
      accountNumberConfirm: "",
    },
    mode: "onChange",
  });

  // International account form
  const internationalForm = useForm<InternationalAccountData>({
    resolver: zodResolver(internationalAccountSchema),
    defaultValues: {
      accountHolderType: "personal",
      firstName: "",
      lastName: "",
      companyName: "",
      holderRole: "",
      swiftCode: "",
      iban: "",
      ibanConfirm: "",
      streetAddress: "",
      apartmentInfo: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    mode: "onChange",
  });

  // PayPal account form
  const paypalForm = useForm<PaypalAccountData>({
    resolver: zodResolver(paypalAccountSchema),
    defaultValues: {
      identifierType: "email",
      paypalEmail: "",
      paypalEmailConfirm: "",
      paypalPhone: "",
      paypalId: "",
      fullName: "",
      paypalCurrency: "USD",
      paypalCountry: "",
    },
    mode: "onChange",
  });

  const selectedBank = localForm.watch("bank");
  const accountNumber = localForm.watch("accountNumber");
  const accountHolderType = internationalForm.watch("accountHolderType");
  const swiftCode = internationalForm.watch("swiftCode");
  const paypalIdentifierType = paypalForm.watch("identifierType");

  // Pre-fill form when editing an existing method
  useEffect(() => {
    if (editingMethod && editingMethod.type !== "international") {
      localForm.setValue("bank", editingMethod.type as "bancolombia" | "nequi" | "otros");
      localForm.setValue("fullName", editingMethod.name);
      localForm.setValue("accountNumber", editingMethod.details);
      
      // Set account type based on bank
      if (editingMethod.type === "nequi") {
        localForm.setValue("accountType", "deposito_electronico");
      } else {
        localForm.setValue("accountType", "ahorros");
      }
      
      // Mark as verified since this is an existing account
      setIsVerified(true);
    }
  }, [editingMethod, localForm]);

  // Reset account type when bank changes (only for new accounts)
  useEffect(() => {
    if (editingMethod) return; // Skip for editing mode

    if (selectedBank === "nequi") {
      localForm.setValue("accountType", "deposito_electronico");
    } else if (selectedBank === "bancolombia" || selectedBank === "otros") {
      localForm.setValue("accountType", "ahorros");
    }

    // Reset validation state whenever bank changes
    setIsValidating(false);
    setIsVerified(false);
    setValidationError(null);
  }, [selectedBank, localForm, editingMethod]);

  // Simulated real-time validation for local accounts
  useEffect(() => {
    if (paymentMethod !== "local") return;
    
    const validateAccount = async () => {
      if (paymentMethod !== "local") return;

      const raw = accountNumber ?? "";
      const digits = raw.replace(/\D/g, "");

      // Keep field sanitized (numbers only)
      if (raw !== digits) {
        localForm.setValue("accountNumber", digits, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const minLen = selectedBank === "nequi" ? 10 : 7;

      if (!digits || digits.length < minLen) {
        // If user is still typing (or cleared the field), make sure we never get stuck in "validating"
        setIsValidating(false);
        setIsVerified(false);
        setValidationError(null);
        return;
      }

      const isNequiValid = selectedBank === "nequi" && /^\d{10}$/.test(digits);
      const isBancolombiaValid = selectedBank === "bancolombia" && /^\d{7,11}$/.test(digits);
      const isOtrosValid = selectedBank === "otros" && /^\d{7,20}$/.test(digits);

      const matchesPattern = isNequiValid || isBancolombiaValid || isOtrosValid;

      if (!matchesPattern) {
        setIsVerified(false);
        setIsValidating(false);
        setValidationError("Número de cuenta inválido");
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      setIsValidating(false);
      setIsVerified(true);
      setValidationError(null);
    };

    const timeoutId = setTimeout(validateAccount, 250);
    return () => clearTimeout(timeoutId);
  }, [accountNumber, selectedBank, paymentMethod]);

  // SWIFT code validation
  useEffect(() => {
    if (paymentMethod !== "international") return;
    
    const validateSwift = async () => {
      if (!swiftCode || swiftCode.length < 8) {
        setSwiftVerified(false);
        setSwiftBankName(null);
        return;
      }

      if (/^[A-Z0-9]{8,11}$/.test(swiftCode)) {
        setIsValidating(false);
        setSwiftVerified(true);
        setSwiftBankName(null);
        return;
      }

      setSwiftVerified(false);
      setSwiftBankName(null);
    };

    const timeoutId = setTimeout(validateSwift, 500);
    return () => clearTimeout(timeoutId);
  }, [swiftCode, paymentMethod]);

  const onLocalSubmit = async (data: LocalAccountData) => {
    // For otros bancos, we don't require real-time verification
    if (data.bank !== "otros" && !isVerified) {
      setValidationError("Por favor espera a que se verifique la cuenta");
      toast.error("Espera a que la cuenta quede verificada");
      return;
    }

    // For otros bancos, require certification file
    if (data.bank === "otros" && !certificationFile) {
      toast.error("Por favor sube la certificación bancaria");
      return;
    }

    // Show success modal - navigation happens when modal closes
    setShowSuccessModal(true);
  };

  const onInternationalSubmit = async (data: InternationalAccountData) => {
    toast.success("Cuenta guardada");
    setShowSuccessModal(true);
  };

  const onPaypalSubmit = async (data: PaypalAccountData) => {
    toast.success("Cuenta PayPal guardada");
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    
    if (paymentMethod === "local") {
      const data = localForm.getValues();
      const newMethod: SavedPaymentMethod = {
        id: Date.now().toString(),
        type: data.bank,
        name: data.fullName,
        details: data.accountNumber,
        currency: "COP",
        status: "pending",
      };
      onComplete?.(newMethod);
    } else if (paymentMethod === "international") {
      const data = internationalForm.getValues();
      const newMethod: SavedPaymentMethod = {
        id: Date.now().toString(),
        type: "international",
        name: data.accountHolderType === "personal" 
          ? `${data.firstName} ${data.lastName || ""}`.trim()
          : data.companyName || "",
        details: `IBAN ${data.iban.slice(-4)}`,
        currency: "USD",
        status: "pending",
      };
      onComplete?.(newMethod);
    } else if (paymentMethod === "paypal") {
      const data = paypalForm.getValues();
      const identifier = data.identifierType === "email" 
        ? data.paypalEmail || "" 
        : data.identifierType === "phone" 
        ? data.paypalPhone || ""
        : data.paypalId || "";
      const newMethod: SavedPaymentMethod = {
        id: Date.now().toString(),
        type: "paypal",
        name: data.fullName,
        details: identifier,
        currency: data.paypalCurrency as SavedPaymentMethod["currency"],
        status: "pending",
      };
      onComplete?.(newMethod);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (onComplete) {
      onComplete();
    } else {
      setPaymentMethod(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {paymentMethod === "international" 
                ? "Cuenta Internacional USD" 
                : paymentMethod === "paypal"
                ? "Cuenta PayPal"
                : "Datos Bancarios"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {paymentMethod === "international"
                ? "Añade la información de tu cuenta bancaria internacional"
                : paymentMethod === "paypal"
                ? "Añade la información de tu cuenta PayPal para recibir pagos"
                : "Verifica que la información ingresada sea correcta antes de continuar"}
            </p>
          </div>

          {/* Payment Method Selection */}
          {!paymentMethod && (
            <div className="space-y-4">
              <Label className="form-label text-base">
                ¿Cómo quieres recibir los pagos?
              </Label>

              {/* Local Options */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("local")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-bancolombia/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-bancolombia" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Cuenta en Colombia (COP)</p>
                    <p className="text-sm text-muted-foreground">Bancolombia/Nequi, otros Bancos</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("international")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Cuenta internacional en dólares otros países (USD)</p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <li>• De 3 a 7 días laborables</li>
                      <li>• Es posible que se te aplique alguna comisión</li>
                    </ul>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-paypal/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-paypal/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-paypal" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">PayPal</p>
                    <p className="text-sm text-muted-foreground">Recibe pagos en tu cuenta PayPal</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-paypal transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* Local Account Form */}
          {paymentMethod === "local" && (
            <Form {...localForm}>
              <form
                onSubmit={localForm.handleSubmit(onLocalSubmit, (errors) => {
                  const firstKey = Object.keys(errors)[0];
                  if (firstKey) {
                    localForm.setFocus(firstKey as any);
                    const msg = (errors as any)[firstKey]?.message as string | undefined;
                    toast.error(msg || "Revisa los campos marcados en rojo");
                  }
                })}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Cambiar método de pago
                </button>

                {/* Bank Selection */}
                <div className="form-section">
                  <Label className="form-label">
                    Selecciona el banco al cual pertenece tu cuenta
                  </Label>
                  <FormField
                    control={localForm.control}
                    name="bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => field.onChange("bancolombia")}
                              className={`bank-card bank-card-bancolombia`}
                              data-selected={field.value === "bancolombia"}
                            >
                              <div className="w-10 h-10 rounded-lg bg-bancolombia/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-bancolombia" />
                              </div>
                              <span className="font-medium text-foreground text-sm">Bancolombia</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("nequi")}
                              className={`bank-card bank-card-nequi`}
                              data-selected={field.value === "nequi"}
                            >
                              <div className="w-10 h-10 rounded-lg bg-nequi/20 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-nequi" />
                              </div>
                              <span className="font-medium text-foreground text-sm">Nequi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("otros")}
                              className={`bank-card`}
                              data-selected={field.value === "otros"}
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-medium text-foreground text-sm">Otros bancos</span>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Other bank selector */}
                  {selectedBank === "otros" && (
                    <FormField
                      control={localForm.control}
                      name="otherBankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Selecciona tu banco</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Selecciona un banco" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colombianBanks.map((bank) => (
                                <SelectItem key={bank.value} value={bank.value}>
                                  {bank.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {selectedBank && (
                  <>
                    {/* Personal Information */}
                    <div className="form-section space-y-4">
                      <h2 className="font-semibold text-foreground">
                        Información del Titular
                      </h2>

                      <FormField
                        control={localForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">
                              Nombre completo del titular
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Como aparece en la certificación bancaria"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-5 gap-3">
                        <FormField
                          control={localForm.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="form-label">Tipo</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {documentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={localForm.control}
                          name="documentNumber"
                          render={({ field }) => (
                            <FormItem className="col-span-3">
                              <FormLabel className="form-label">
                                Número de documento
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Sin puntos ni guiones"
                                  {...field}
                                  className="h-12"
                                  inputMode="numeric"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Email field for otros bancos */}
                      {selectedBank === "otros" && (
                        <FormField
                          control={localForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="form-label">
                                Correo electrónico
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Para enviar el comprobante de transferencia"
                                  {...field}
                                  className="h-12"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-muted-foreground">
                                Te enviaremos el comprobante de cada transferencia a este correo
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Banking Information */}
                    <div className="form-section space-y-4">
                      <h2 className="font-semibold text-foreground">
                        Información Bancaria
                      </h2>

                      {(selectedBank === "bancolombia" || selectedBank === "otros") && (
                        <FormField
                          control={localForm.control}
                          name="accountType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="form-label">Tipo de cuenta</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ahorros" id="ahorros" />
                                    <Label htmlFor="ahorros" className="cursor-pointer">
                                      Ahorros
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="corriente" id="corriente" />
                                    <Label htmlFor="corriente" className="cursor-pointer">
                                      Corriente
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedBank === "nequi" && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-nequi/10 rounded-lg">
                          <Smartphone className="w-4 h-4 text-nequi" />
                          <span className="text-sm text-muted-foreground">
                            Tipo de cuenta: <span className="font-medium text-foreground">Depósito Electrónico</span>
                          </span>
                        </div>
                      )}

                      <FormField
                        control={localForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">
                              {selectedBank === "nequi"
                                ? "Número de celular"
                                : "Número de cuenta"}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder={
                                    selectedBank === "nequi"
                                      ? "10 dígitos (ej: 3001234567)"
                                      : selectedBank === "otros"
                                      ? "Número de cuenta bancaria"
                                      : "7 a 11 dígitos"
                                  }
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                  className="h-12 pr-12"
                                  inputMode="numeric"
                                  maxLength={selectedBank === "nequi" ? 10 : selectedBank === "otros" ? 20 : 11}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {isValidating && selectedBank !== "otros" && (
                                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                                  )}
                                  {!isValidating && isVerified && selectedBank !== "otros" && (
                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                  )}
                                  {!isValidating && validationError && selectedBank !== "otros" && (
                                    <AlertCircle className="w-5 h-5 text-destructive" />
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                            {isVerified && selectedBank !== "otros" && (
                              <p className="validation-success mt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Cuenta Verificada
                              </p>
                            )}
                            {validationError && selectedBank !== "otros" && (
                              <p className="validation-error mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {validationError}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Account number confirmation for otros bancos */}
                      {selectedBank === "otros" && (
                        <FormField
                          control={localForm.control}
                          name="accountNumberConfirm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="form-label">
                                Confirmar número de cuenta
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Escribe nuevamente el número de cuenta"
                                  {...field}
                                  className="h-12"
                                  inputMode="numeric"
                                  maxLength={20}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-muted-foreground">
                                Por seguridad, confirma el número de cuenta
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Bank certification upload for otros bancos */}
                      {selectedBank === "otros" && (
                        <div className="space-y-2">
                          <Label className="form-label">
                            Certificación bancaria
                          </Label>
                          <div 
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                              certificationFile 
                                ? "border-success bg-success/5" 
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert("El archivo no puede superar los 5MB");
                                    return;
                                  }
                                  setCertificationFile(file);
                                }
                              }}
                            />
                            {certificationFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-success" />
                                <div className="text-left">
                                  <p className="font-medium text-foreground text-sm">
                                    {certificationFile.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(certificationFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCertificationFile(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  }}
                                  className="p-1 rounded-full hover:bg-muted"
                                >
                                  <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="font-medium text-foreground text-sm">
                                  Sube tu certificación bancaria
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PDF o imagen (máx. 5MB) • No mayor a 3 meses
                                </p>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            La certificación será revisada por nuestro equipo antes de habilitar los pagos
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-14 text-base font-semibold"
                      disabled={isValidating}
                    >
                      {isValidating && selectedBank !== "otros" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Validando cuenta...
                        </>
                      ) : (
                        "Registrar datos"
                      )}
                    </Button>
                  </>
                )}
              </form>
            </Form>
          )}

          {/* International Account Form */}
          {paymentMethod === "international" && (
            <Form {...internationalForm}>
              <form
                onSubmit={internationalForm.handleSubmit(onInternationalSubmit, (errors) => {
                  const firstKey = Object.keys(errors)[0];
                  if (firstKey) {
                    internationalForm.setFocus(firstKey as any);
                    const msg = (errors as any)[firstKey]?.message as string | undefined;
                    toast.error(msg || "Revisa los campos marcados en rojo");
                  }
                })}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Cambiar método de pago
                </button>

                {/* Account Holder Type */}
                <div className="form-section space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">
                    Indica el nombre del titular de la cuenta
                  </h2>

                  <FormField
                    control={internationalForm.control}
                    name="accountHolderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Tipo de cuenta</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="personal" id="personal" />
                              <Label htmlFor="personal" className="cursor-pointer font-normal">
                                Personal
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="empresarial" id="empresarial" />
                              <Label htmlFor="empresarial" className="cursor-pointer font-normal">
                                Empresarial
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Personal account fields */}
                  {accountHolderType === "personal" && (
                    <>
                      <FormField
                        control={internationalForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Nombre del titular de la cuenta</FormLabel>
                            <div className="rounded-xl border border-border overflow-hidden">
                              <FormControl>
                                <Input
                                  placeholder="Nombre"
                                  {...field}
                                  className="h-12 border-0 border-b border-border rounded-none focus-visible:ring-0"
                                />
                              </FormControl>
                              <Input
                                placeholder="Apellidos"
                                value={internationalForm.watch("lastName") || ""}
                                onChange={(e) => internationalForm.setValue("lastName", e.target.value)}
                                className="h-12 border-0 rounded-none focus-visible:ring-0"
                              />
                            </div>
                            <FormDescription className="text-xs text-muted-foreground">
                              Introduce el nombre del titular de la cuenta tal y como figura en los extractos bancarios. En el caso de las cuentas con varios propietarios, indica un solo nombre.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Business account fields */}
                  {accountHolderType === "empresarial" && (
                    <FormField
                      control={internationalForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Nombre del titular de la cuenta</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre de la empresa"
                              {...field}
                              className="h-12"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Introduce el nombre de la empresa o la persona jurídica tal y como aparece en la cuenta.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Role selector */}
                  <FormField
                    control={internationalForm.control}
                    name="holderRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">¿Cuál es su función?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Función" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountHolderRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bank Account Details */}
                <div className="form-section space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">
                    Añade la información de tu cuenta bancaria
                  </h2>

                  {/* SWIFT Code */}
                  <FormField
                    control={internationalForm.control}
                    name="swiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Código SWIFT/BIC</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Código SWIFT/BIC"
                              {...field}
                              className="h-12 uppercase pr-12"
                              maxLength={11}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isValidating && (
                                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                              )}
                              {!isValidating && swiftVerified && (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          El código SWIFT o BIC suele tener entre ocho y 11 caracteres. Puedes consultarlo en tu extracto bancario o en los detalles de tu cuenta.
                        </FormDescription>
                        {swiftVerified && swiftBankName && (
                          <p className="validation-success mt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {swiftBankName}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* IBAN */}
                  <FormField
                    control={internationalForm.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">IBAN</FormLabel>
                        <div className="rounded-xl border border-border overflow-hidden">
                          <FormControl>
                            <Input
                              placeholder="IBAN"
                              {...field}
                              className="h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 uppercase"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
                            />
                          </FormControl>
                          <Input
                            placeholder="Confirma el IBAN"
                            value={internationalForm.watch("ibanConfirm") || ""}
                            onChange={(e) => internationalForm.setValue("ibanConfirm", e.target.value.toUpperCase().replace(/\s/g, ""))}
                            className="h-12 border-0 rounded-none focus-visible:ring-0 uppercase"
                          />
                        </div>
                        <FormDescription className="text-xs text-muted-foreground">
                          El IBAN (International Bank Account Number) se encuentra en tu extracto bancario o en la información de tu cuenta. No se permiten espacios.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Section */}
                <div className="form-section space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">
                    Añade la dirección asociada a esta cuenta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Es la dirección que el banco o la institución financiera tiene registrada para esta cuenta. Debe coincidir con la de los últimos extractos bancarios.
                  </p>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <FormField
                      control={internationalForm.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            placeholder="Dirección postal"
                            {...field}
                            className="h-12 border-0 border-b border-border rounded-none focus-visible:ring-0"
                          />
                        </FormControl>
                      )}
                    />
                    <FormField
                      control={internationalForm.control}
                      name="apartmentInfo"
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            placeholder="Piso, puerta (opcional)"
                            {...field}
                            className="h-12 border-0 border-b border-border rounded-none focus-visible:ring-0"
                          />
                        </FormControl>
                      )}
                    />
                    <FormField
                      control={internationalForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            placeholder="Municipio"
                            {...field}
                            className="h-12 border-0 border-b border-border rounded-none focus-visible:ring-0"
                          />
                        </FormControl>
                      )}
                    />
                    <div className="grid grid-cols-2">
                      <FormField
                        control={internationalForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              placeholder="Estado"
                              {...field}
                              className="h-12 border-0 border-r border-border rounded-none focus-visible:ring-0"
                            />
                          </FormControl>
                        )}
                      />
                      <FormField
                        control={internationalForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              placeholder="Código postal"
                              {...field}
                              className="h-12 border-0 rounded-none focus-visible:ring-0"
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <FormField
                    control={internationalForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-muted/50">
                              <SelectValue placeholder="País/región" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
                >
                  Registrar cuenta internacional
                </Button>
              </form>
            </Form>
          )}

          {/* PayPal Account Form */}
          {paymentMethod === "paypal" && (
            <Form {...paypalForm}>
              <form
                onSubmit={paypalForm.handleSubmit(onPaypalSubmit, (errors) => {
                  const firstKey = Object.keys(errors)[0];
                  if (firstKey) {
                    paypalForm.setFocus(firstKey as any);
                    const msg = (errors as any)[firstKey]?.message as string | undefined;
                    toast.error(msg || "Revisa los campos marcados en rojo");
                  }
                })}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Cambiar método de pago
                </button>

                {/* Verified account warning */}
                <div className="flex gap-3 p-4 rounded-xl bg-paypal/5 border border-paypal/20">
                  <div className="w-10 h-10 rounded-full bg-paypal/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-paypal" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Tu cuenta PayPal <strong>debe estar verificada</strong> y configurada para recibir pagos. Si la cuenta es nueva o no está verificada, PayPal podría retener los fondos.
                  </p>
                </div>

                {/* Identifier Type */}
                <div className="form-section space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">
                    Identificador de tu cuenta PayPal
                  </h2>

                  <FormField
                    control={paypalForm.control}
                    name="identifierType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Tipo de identificador</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="email" id="paypal-email" />
                              <Label htmlFor="paypal-email" className="cursor-pointer font-normal">
                                Correo electrónico
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="phone" id="paypal-phone" />
                              <Label htmlFor="paypal-phone" className="cursor-pointer font-normal">
                                Número de teléfono móvil
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="paypalId" id="paypal-id" />
                              <Label htmlFor="paypal-id" className="cursor-pointer font-normal">
                                PayPal ID (Id. de comercio)
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email fields */}
                  {paypalIdentifierType === "email" && (
                    <>
                      <FormField
                        control={paypalForm.control}
                        name="paypalEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Correo electrónico de PayPal</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="tu@email.com"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-muted-foreground">
                              Debe ser el email principal vinculado y verificado en tu cuenta PayPal.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paypalForm.control}
                        name="paypalEmailConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Confirmar correo electrónico</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Repite tu correo de PayPal"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-muted-foreground">
                              Por seguridad, confirma el correo electrónico.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Phone field */}
                  {paypalIdentifierType === "phone" && (
                    <FormField
                      control={paypalForm.control}
                      name="paypalPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Número de teléfono</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+573001234567"
                              {...field}
                              className="h-12"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Incluye el código de país (ej: +57 para Colombia, +1 para EE.UU.). Debe estar registrado y verificado en PayPal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* PayPal ID field */}
                  {paypalIdentifierType === "paypalId" && (
                    <FormField
                      control={paypalForm.control}
                      name="paypalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">PayPal ID (Id. de comercio)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: 2NF2MMNKY47WQ"
                              {...field}
                              className="h-12 uppercase"
                              maxLength={13}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Es un código alfanumérico de 13 caracteres. Lo encuentras en tu cuenta de PayPal en: Configuración → Opciones de cuenta → Id. de comercio.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Compliance Fields */}
                <div className="form-section space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">
                    Datos del titular
                  </h2>

                  <FormField
                    control={paypalForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Nombre completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Como aparece en tu cuenta PayPal"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          Debe coincidir con el nombre del titular de la cuenta PayPal para conciliación.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paypalForm.control}
                    name="paypalCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">Divisa de pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona la divisa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paypalCurrencies.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-muted-foreground">
                          La moneda en la que recibirás los fondos.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paypalForm.control}
                    name="paypalCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label">País de residencia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecciona tu país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-muted-foreground">
                          PayPal tiene restricciones específicas según el país.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
                >
                  Registrar cuenta PayPal
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        isInternational={paymentMethod === "international" || paymentMethod === "paypal"}
      />
    </>
  );
}
