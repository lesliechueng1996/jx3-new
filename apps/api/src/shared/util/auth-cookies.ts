export const applySetCookieHeaders = (
  set: { headers: Record<string, unknown> },
  cookies: string[],
): void => {
  if (cookies.length === 0) {
    return;
  }

  set.headers['set-cookie'] = cookies.length === 1 ? cookies[0] : cookies;
};
