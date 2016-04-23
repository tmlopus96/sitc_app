<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = $_GET['carpoolSite'];
  //echo $carpoolSite;

  $query = "SELECT p.person_id, p.firstName, p.lastName, p.isCrew, p.preferredProject, p.hasCar, p.carMake, p.numSeatbelts, c.hasPermanentAssignment, c.assignedProject, c.assignedSite FROM Person p LEFT JOIN Crew c ON c.person_id=p.person_id WHERE p.primaryCarpool_id='$carpoolSite'";

  $result_persons = $connection->query($query);
  if (!$result_persons)
    die ($connection->error);

  $personsArr = array();
  while ($person = $result_persons->fetch_assoc()) {
    $personsArr[] = $person;
  }

  echo json_encode($personsArr);

?>
