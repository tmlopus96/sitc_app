<?php

  require_once 'sitc_workforce_creds.php';

  date_default_timezone_set('America/Detroit');
  $date = new DateTime('');
  // echo date('Y-m-d', $date->getTimestamp());
  $dateString = date('Y-m-d', $date->getTimestamp());

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $query = "SELECT p.person_id, p.firstName, p.lastName, p.primaryCarpool_id, p.isCrew, p.preferredProject, p.hasCar, p.carMake, p.numSeatbelts, p.imgUrl, r.email, c.hasPermanentAssignment, c.assignedProject, c.assignedSite, ch.isCheckedIn, ch.isDriver, r.paymentMethod, r.paymentStatus, hu.isComing, hu.headsUp_preferredProject, hu.headsUp_hasCar, hu.headsUp_numSeatbelts FROM Person p LEFT JOIN Crew c ON c.person_id=p.person_id LEFT JOIN CheckedIn ch ON p.person_id=ch.person_id LEFT JOIN RegistrationInfo r ON p.person_id=r.person_id LEFT JOIN HeadsUp hu ON p.person_id=hu.person_id AND hu.forDate='$dateString'";

  if (isset($_GET['carpoolSite'])) {
    // echo "Condition evaled to true";
    $carpoolSite = $_GET['carpoolSite'];
    $query = $query . " WHERE (p.primaryCarpool_id='$carpoolSite')";
  }

  // Note: if both carpoolSite and person_id are set, an empty set may be returned if that person's primaryCarpool_id != carpoolSite
  if (isset($_GET['person_id'])) {
    if (strpos($query, 'WHERE')) {
      $query .= ' AND ';
    }
    else {
      $query .= ' WHERE ';
    }
    $query .= "p.person_id=" . intval(sanitize($_GET['person_id']));
  }

  // echo $query;
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
