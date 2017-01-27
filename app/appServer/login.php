<?php

  require_once 'sitc_workforce_creds.php';

  $usernameToAuth = sanitize(htmlspecialchars($_GET["username"]));
  $passwordToAuth = sanitize($_GET["password"]);
  //echo "passwordToAuth: " . $passwordToAuth . "$nbsp;";

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $query = "SELECT username, password, person_id FROM SystemUser WHERE username='$usernameToAuth'";
  $queryResult = $connection->query($query);
  if (!$queryResult)
    die ($connection->error);

  $userInfo = $queryResult->fetch_assoc();
  //echo "passwordFromDB: " . $userInfo['password'] . "$nbsp";

  if ($queryResult->num_rows == 0) {
    http_response_code(403);
    exit ('usernameNotFound');
  } else if (password_verify($passwordToAuth, $userInfo['password'])) {
    echo json_encode($userInfo);
  } else {
    http_response_code(403);
    exit ('passwordIncorrect');
  }


 ?>

 <?php
  function sanitize($var) {
    $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
    return $clean_var;
  }
 ?>
