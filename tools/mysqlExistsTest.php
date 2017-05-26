<?php

  require_once '../app/appServer/sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  // $query = "SELECT * FROM VolunteerCar WHERE teerCar_id=14";
  // echo $query;
  // $result = $connection->query($query);
  //
  // if (!$result->num_rows) {
  //   echo "True!";
  //   echo var_dump($result);
  // }
  // else {
  //   echo "False!";
  //   echo $result->current_field;
  // }
  // $query = "SELECT teerCar_id FROM VolunteerCar ORDER BY teerCar_id DESC LIMIT 1";
  // $result = $connection->query($query);
  // $teerCarId = $result->fetch_assoc()['teerCar_id'];
  // echo "teerCarId, pre increment: " . $teerCarId;
  // $teerCarId++;
  // echo "teerCarId: " . $teerCarId;

  $testString = 'make_me_null';
  echo (strcmp($testString, 'make_me_null'))

?>
