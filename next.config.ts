import type {NextConfig} from 'next';
const config:NextConfig={reactStrictMode:true,async headers(){return [{source:'/(.*)',headers:[
{key:'X-Content-Type-Options',value:'nosniff'},
{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
{key:'X-Frame-Options',value:'DENY'},
{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
{key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"}
]}]}};export default config;
