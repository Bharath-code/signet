export type FieldConfidence = 'exact' | 'high' | 'medium' | 'low';

export type BrandKitConfidence = {
  companyName: FieldConfidence;
  logoUrl: FieldConfidence;
  primaryColor: FieldConfidence;
  secondaryColor: FieldConfidence;
  fontFamily: FieldConfidence;
};

export type BrandKit = {
  companyName: string;
  logoUrl: string;
  primaryColor: string;   // hex
  secondaryColor: string; // hex
  fontFamily: string;
};

export type SignatureFields = {
  fullName: string;
  jobTitle: string;
  ctaText: string;  // button label for logo-cta layout; role-defaulted, user-overridable
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  x: string;
  discord: string;
};

// Fields the user can show/hide. Name + title always render (identity); the rest toggle.
// ctaText is excluded — it's not a visibility toggle, it's always editable.
export type ToggleableField = Exclude<keyof SignatureFields, 'fullName' | 'jobTitle' | 'ctaText'>;
export type Visibility = Record<ToggleableField, boolean>;

export type Layout = 'minimal' | 'logo' | 'logo-cta';
