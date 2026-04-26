// Inline script injected into <head> — runs before paint to avoid flash.
// Must be a plain string with no external deps.
export function ThemeScript() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('naiczyciel-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim();

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional inline theme init
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
