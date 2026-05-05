export {};

declare module "skybridge/server" {
  interface ViewNameRegistry {
    "backups": true;
    "crm": true;
    "dashboard": true;
    "documents": true;
    "emails": true;
    "finances": true;
    "home-assistant": true;
    "photos": true;
    "proxmox": true;
  }
}
