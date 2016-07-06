<?php

  $curl = curl_init('https://sitc.wufoo.com/api/v3/forms.json');
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($curl, CURLOPT_USERPWD, 'FXRL-LPSN-VWJG-SCCK:footastic');
  curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
  curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, true);
  curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($curl, CURLOPT_USERAGENT, 'Wufoo Sample Code');

  $response = curl_exec($curl);
  $resultStatus = curl_getinfo($curl);

  if($resultStatus['http_code'] == 200) {
      $json = json_decode($response);
      echo json_encode($json, JSON_PRETTY_PRINT);
  } else {
      echo 'Call Failed '.print_r($resultStatus);
  }

?>
