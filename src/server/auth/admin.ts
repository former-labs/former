
const ADMIN_EMAILS = [
  "matty.hempstead@gmail.com",
  "elliott.lovell88@gmail.com",
];

export const isAdminEmail = (email: string) => {
  if (!email) {
    return false;
  }
  return ADMIN_EMAILS.includes(email);
};
