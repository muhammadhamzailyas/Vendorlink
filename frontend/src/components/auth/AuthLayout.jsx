import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import GoogleAuthButton from "./GoogleAuthButton";
import { Card } from "../ui";

const AuthLayout = ({
  children,
  title,
  subtitle,
  headerIcon,
  onGoogleLogin,
  googleDisabled = false,
  googleLoading = false,
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
                <div className="flex items-center gap-3 mb-6">
                  <GoogleAuthButton 
                    onClick={onGoogleLogin} 
                    disabled={googleDisabled} 
                    loading={googleLoading} 
                    fullWidth 
                  />
                </div>

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
