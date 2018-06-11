<?php

  require_once 'sitc_workforce_creds.php';

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  $query = "SELECT ch.person_id, tr.firstName, tr.lastName, tr.isDriver FROM TempRegistration tr LEFT JOIN CheckedIn ch ON tr.temp_person_id=ch.person_id";

  // if (isset($_GET['carpoolSite'])) {
  //   // echo "Condition evaled to true";
  //   $carpoolSite = $_GET['carpoolSite'];
  //   $query = $query . " WHERE ch.carpoolSite_id='$carpoolSite'";
  // }

  // Note: if both carpoolSite and person_id are set, an empty set may be returned if that person's primaryCarpool_id != carpoolSite
  if (isset($_GET['temp_person_id'])) {
    if (strpos($query, 'WHERE') === false) {
      $query = $query . " WHERE ";
    }
    else {
      $query = $query . " && ";
    }
    $query = $query . "temp_person_id=" . intval(sanitize($_GET['temp_person_id']));
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
