# Tailscale Remote Access

Access the Pi from anywhere.

## Setup

**On Pi:**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
Opens auth URL. Login with Google/GitHub/email.

**On your laptop:**
- Download from tailscale.com/download
- Login with same account

## Usage

From anywhere:
```bash
ssh pi@moody-bell
```

Browser: `http://moody-bell`

## Notes

- Free, encrypted, works through firewalls
- If hostname fails, use IP: `tailscale ip -4`
