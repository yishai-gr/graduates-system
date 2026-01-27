<?php
// Simple deploy script to be triggered by webhook or manually
// Security: In production, add a secret token check here!

// 1. Check for secret token
if (!isset($_GET['token']) || $_GET['token'] !== 'YOUR_SECRET_TOKEN_HERE') {
  // Note: In production, replace 'YOUR_SECRET_TOKEN_HERE' with a real random string
  // OR better, set it dynamically from an environment variable or file if possible, 
  // but for simple hosting, hardcoding a long random string here and matching it in the GitHub Secret is the easiest path.
  // Ideally, the user will change 'YOUR_SECRET_TOKEN_HERE' to something secure.
  // For this guide, I will leave it as a placeholder that MUST be changed.
  http_response_code(403);
  die('Forbidden: Invalid token');
}

// 2. Commands
$commands = [
  'echo $PWD',
  'whoami',
  'git pull 2>&1', // Pulls the current branch from its tracked upstream
  'git status',
];

// 3. Run commands
$output = '';
foreach ($commands as $command) {
  // Run it
  $tmp = shell_exec($command);
  // Output
  $output .= "<span style=\"color: #6BE234;\">\$</span> <span style=\"color: #729FCF;\">{$command}\n</span>";
  $output .= htmlentities(trim($tmp)) . "\n";
}

// 4. Reset opcode cache if necessary
if (function_exists('opcache_reset')) {
  opcache_reset();
  $output .= "Opcache reset.\n";
}

?>
<!DOCTYPE HTML>
<html lang="en-US">

<head>
  <meta charset="UTF-8">
  <title>Deployment Script</title>
</head>

<body style="background-color: #000000; color: #FFFFFF; font-weight: bold; padding: 0 10px;">
  <pre>
<?php echo $output; ?>
</pre>
</body>

</html>