import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import GoogleAuthButton from "./GoogleAuthButton";
import { Card } from "../ui";

const AuthLayout = ({
  children,
  title,
  subtitle,
  onGoogleLogin,
  googleDisabled = false,
  googleLoading = false,
  hideGoogle = false,
  footerText,
  footerLinkText,
  footerLinkTo,
  extraFooterLink,
  maxWidth = "max-w-md",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6 overflow-hidden bg-muted">
      <div className={`w-full ${maxWidth} relative z-10`}>
        <Card
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out motion-reduce:transition-none shadow-sm border-border bg-card",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          <Card.Header className="text-center pt-8 pb-0 border-b-0">
            <div
              className={cn(
                "transition-all duration-500 delay-75 ease-out motion-reduce:transition-none",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
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
                <div
                  className={cn(
                    "flex items-center gap-3 mb-6 transition-all duration-500 delay-100 ease-out motion-reduce:transition-none",
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  <GoogleAuthButton 
                    onClick={onGoogleLogin} 
                    disabled={googleDisabled} 
                    loading={googleLoading} 
                    fullWidth 
                  />
                </div>

                {/* Divider */}
                <div
                  className={cn(
                    "flex items-center gap-3 mb-6 transition-all duration-500 delay-150 ease-out motion-reduce:transition-none",
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            {/* Content */}
            <div
              className={cn(
                "transition-all duration-500 delay-200 ease-out motion-reduce:transition-none",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              {children}
            </div>
          </Card.Content>

          <Card.Footer className="justify-center pt-5 pb-6 bg-muted border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link to={footerLinkTo} className="font-bold transition text-foreground hover:opacity-80">
                {footerLinkText}
              </Link>
              {extraFooterLink && (
                <>
                  {" "}or{" "}
                  <Link to={extraFooterLink.to} className="font-bold transition text-foreground hover:opacity-80">
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



