export interface Address {
  id?: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  addressType: 'current' | 'previous' | 'correspondence';
  residenceSince?: string;
}

export interface ContactDetails {
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  preferredContactMethod: 'phone' | 'email' | 'post';
}
