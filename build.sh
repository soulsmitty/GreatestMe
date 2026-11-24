#!/usr/bin/env bash
# Wraps app.html (the artifact source) into a standalone index.html for any static host (GitHub Pages, Netlify, etc.).
set -euo pipefail
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  printf '<meta name="theme-color" content="#8B5CF6"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">\n'
  printf '<meta name="apple-mobile-web-app-title" content="GreatestMe"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
  printf '<script src="config.js"></script>\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
  printf '</head><body>\n'
  cat app.html
  printf '\n</body></html>\n'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
