<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $carpoolSite = sanitize($_GET['carpoolSite']);
  //echo $carpoolSite;

  $query = "SELECT p.person_id, p.firstName, p.lastName, p.isCrew, p.preferredProject, p.hasCar, p.carMake, p.numSeatbelts, p.imgUrl, c.hasPermanentAssignment, c.assignedProject, c.assignedSite, ch.assignedToProject, ch.assignedToSite_id, ch.driverStatus, ch.assignedToDriver_id FROM Person p LEFT JOIN Crew c ON c.person_id=p.person_id LEFT JOIN CheckedIn ch ON p.person_id=ch.person_id WHERE p.primaryCarpool_id='$carpoolSite' ORDER BY ch.driverStatus DESC";

  $result_persons = $connection->query($query);
  if (!$result_persons)
    die ($connection->error);

  $personsArr = array();
  while ($person = $result_persons->fetch_assoc()) {
    $personsArr[] = $person;
  }

  echo json_encode($personsArr);

?>

<?php
 function sanitize($var) {
   $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
   return $clean_var;
 }
?>
