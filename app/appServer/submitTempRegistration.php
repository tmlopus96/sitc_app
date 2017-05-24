<?php

  require_once 'sitc_workforce_creds.php';
  date_default_timezone_set('UTC');

  $connection = new mysqli($hostname, $username, $password, $database);
  if ($connection->connect_error)
    die ($connection->connect_error);

  // Find out what the latest id is so we can set this person's
  $query = "SELECT temp_person_id FROM TempRegistration ORDER BY temp_person_id ASC LIMIT 1";
  $result = $connection->query($query);

  $result_arr = $result->fetch_assoc();

  $myPersonId = intval($result_arr['temp_person_id']);
  $myPersonId--;

  $personInfo = json_decode($_GET["personInfo"], true);

  $personFields = array('temp_person_id');
  $personValues = array($myPersonId);
  foreach ($personInfo as $key => $value) {
    array_push($personFields, $key);
    array_push($personValues, $value);
  }

  // stringify fields arrays for query string
  $personFields = join(', ', $personFields);
  $personValues = '"' . join('", "', $personValues) . '"';

  $query = "INSERT INTO TempRegistration($personFields) VALUES ($personValues)";
  // echo $query;

  $person_result = $connection->query($query);
  if ($connection->error) {
    die ($connection->error);
  }
  else {
    echo $myPersonId;
  }

?>

<?php

  function sanitize($var) {
    $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
    return $clean_var;
  }

?>
