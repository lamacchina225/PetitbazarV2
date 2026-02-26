import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (!token) return false;
        if (path.startsWith('/admin')) return token.role === 'ADMIN';
        if (path.startsWith('/gestionnaire')) return token.role === 'GESTIONNAIRE';
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/gestionnaire/:path*', '/my-orders/:path*', '/checkout/:path*'],
};
