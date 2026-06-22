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
  email: string;
  phone: string;
};

export type Layout = 'minimal' | 'logo' | 'logo-cta';
