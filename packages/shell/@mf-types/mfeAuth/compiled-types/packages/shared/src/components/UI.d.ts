import React from 'react';
import { Colors } from '../theme';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    tone?: 'default' | 'lovable';
    label: string;
}
export declare const Button: React.FC<ButtonProps>;
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    variant?: 'underline' | 'bordered';
}
export declare const TextField: React.FC<TextFieldProps>;
interface GoogleOAuthButtonProps {
    onClick?: () => void;
    enabled?: boolean;
    loading?: boolean;
}
export declare const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps>;
interface OAuthButtonsProps {
    onGoogle?: () => void;
    googleEnabled?: boolean;
    googleLoading?: boolean;
}
export declare const OAuthButtons: React.FC<OAuthButtonsProps>;
export { Colors };
