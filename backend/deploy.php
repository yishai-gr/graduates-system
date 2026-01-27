<?php
// Simple deploy script to be triggered by webhook or manually
// Security: In production, add a secret token check here!

// 1. Check for secret token (Optional but recommended)
// $headers = getallheaders();
// if (!isset($headers['X-Hub-Signature']) && !isset($_GET['token'])) {
//     http_response_code(403);
//     die('Forbidden');
// }

// 2. Commands
$commands = [
  'echo $PWD',
  'whoami',
  'git pull origin master 2>&1', // Adjust branch if needed
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