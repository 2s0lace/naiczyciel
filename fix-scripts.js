const fs = require('fs');
let code = fs.readFileSync('scripts.js', 'utf8');

const badBlock = "      container.innerHTML = `\n      container.innerHTML = `\n        < div class=\"profile-dropdown\" id = \"profile-dropdown-${firstName.toLowerCase()}\" >";
if (code.includes(badBlock)) {
  console.log('Found exact bad block');
  code = code.replace(badBlock, "      container.innerHTML = `\n        <div class=\"profile-dropdown\" id=\"profile-dropdown-${firstName.toLowerCase()}\">");
  fs.writeFileSync('scripts.js', code);
} else {
  // Let's use regex
  code = code.replace(/container\.innerHTML = `[\s\n]*container\.innerHTML = `[\s\n]*< div class="profile-dropdown" id = "profile-dropdown-\$\{firstName\.toLowerCase\(\)\}" >/, 
  'container.innerHTML = `\n        <div class="profile-dropdown" id="profile-dropdown-${firstName.toLowerCase()}">');
  fs.writeFileSync('scripts.js', code);
  console.log('Regex replace executed');
}
