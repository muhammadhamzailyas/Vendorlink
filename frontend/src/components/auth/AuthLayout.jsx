import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Card, Button } from "../ui";
import { loginWithGoogle } from "../../lib/auth";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 40 48">
    <path fill="#4285F4" d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71"/>
    <path fill="#34A853" d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44"/>
    <path fill="#FABB05" d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97z"/>
    <path fill="#E94235" d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12"/>
  </svg>
);

const AuthLayout = ({
  children,
  title,
  subtitle,
  headerIcon,
  googleDisabled = false,
  hideGoogle = false,
  footerText,
  footerLinkText,
  footerLinkTo,
  extraFooterLink,
  onLinkClick,
  maxWidth = "max-w-md",
}) => {
  const handleLinkClick = (e, to) => {
    if (onLinkClick) {
      onLinkClick(e, to);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6 bg-background">
      <div className={`w-full ${maxWidth} relative z-10 py-8`}>
        <Card
          className={cn(
            "overflow-hidden shadow-sm border-border bg-card"
          )}
        >
          <Card.Header className="text-center pt-8 pb-0 border-b-0">
            {headerIcon && (
                <div className="flex justify-center mb-6">
                    {headerIcon}
                </div>
            )}
            <div>
              <Card.Title className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                {title}
              </Card.Title>
              <Card.Description className="text-sm md:text-md text-muted-foreground">
                {subtitle}
              </Card.Description>
            </div>
          </Card.Header>

          <Card.Content className="pt-6 pb-6 px-8">
            {/* Google Login */}
            {!hideGoogle && (
              <>
                <div className="grid-cols-1 grid gap-3 mb-6">
                  <Button 
                    variant="secondary" 
                    className="w-full h-11 font-semibold tracking-wide uppercase text-xs gap-2"
                    onClick={handleGoogleLogin} 
                    disabled={googleDisabled}
                  >
                    <GoogleIcon />
                    Continue with Google
                  </Button></div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            {/* Content */}
            <div className="animate-in fade-in duration-500">
              {children}
            </div>
          </Card.Content>

          <Card.Footer className="justify-center pt-5 pb-6 bg-muted/30 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link 
                to={footerLinkTo} 
                className="font-bold transition text-foreground hover:opacity-80"
                onClick={(e) => handleLinkClick(e, footerLinkTo)}
              >
                {footerLinkText}
              </Link>
              {extraFooterLink && (
                <>
                  {" "}or{" "}
                  <Link 
                    to={extraFooterLink.to} 
                    className="font-bold transition text-foreground hover:opacity-80"
                    onClick={(e) => handleLinkClick(e, extraFooterLink.to)}
                  >
                    {extraFooterLink.text}
                  </Link>
                </>
              )}
            </p>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
