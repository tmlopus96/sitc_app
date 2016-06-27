<?php

  require_once 'sitc_workforce_creds.php';

  $myUsername = sanitize(htmlspecialchars($_GET["username"]));
  echo $myUsername;
  $newPassword = sanitize($_GET['newPassword']);
  echo $newPassword;

  $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
  echo $newPasswordHash;

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $query = "UPDATE SystemUser SET password='$newPasswordHash' WHERE username='$myUsername'";
  $queryResult = $connection->query($query);
  if (!$queryResult)
    die ($connection->error);

?>

<?php
 function sanitize($var) {
   $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
   return $clean_var;
 }
?>
