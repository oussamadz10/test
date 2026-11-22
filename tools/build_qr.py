"""Assemble public/assets/qr.js from the MIT 'QRCode for JavaScript' (Kazuhiko Arase) vendored in npm's qrcode-terminal."""
import os, sys
D = sys.argv[1] if len(sys.argv) > 1 else '/opt/node22/lib/node_modules/npm/node_modules/qrcode-terminal/vendor/QRCode'
mods = ['QRMode', 'QRErrorCorrectLevel', 'QRMaskPattern', 'QRMath', 'QRPolynomial', 'QR8bitByte', 'QRBitBuffer', 'QRRSBlock', 'QRUtil', 'index']
out = ["/*! QRCode for JavaScript – Copyright (c) 2009 Kazuhiko Arase – MIT license – http://www.d-project.com/ */",
       "(function () {", "var M = {};", "function req(n) { return M[n.replace('./', '')]; }"]
for m in mods:
    src = open(os.path.join(D, m + '.js'), encoding='utf-8').read().replace('require(', 'req(')
    out.append("M['%s'] = (function () { var module = { exports: {} }; %s\nreturn module.exports; })();" % (m, src))
out.append("""var QRCode = M['index'], ECL = M['QRErrorCorrectLevel'];
// SVG carré (chemin unique) pour un texte, niveau de correction M
window.QR = { svg: function (text, size) {
  var q = new QRCode(-1, ECL.M); q.addData(text); q.make();
  var n = q.getModuleCount(), b = 2, d = '';
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + b) + ' ' + (r + b) + 'h1v1h-1z';
  var w = n + 2 * b;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" width="' + (size || 96) + '" height="' + (size || 96) + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
} };
})();""")
open(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'qr.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('ok')
