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
    sendEmail($personInfo);
  }




?>

<?php

  function sendEmail($personInfo) {
    //SMTP needs accurate times, and the PHP time zone MUST be set
    //This should be done in your php.ini, but this is how to do it if you don't have access to that
    date_default_timezone_set('Etc/UTC');

    require_once 'sitc_workforce_creds.php';

    require_once __DIR__ . '/../../bower_components/phpmailer/PHPMailerAutoload.php';

    //Create a new PHPMailer instance
    $mail = new PHPMailer;

    $info = $personInfo;

    $firstName = $info['firstName'];
    $lastName = $info['lastName'];
    $email = $info['email'];
    $phone = $info['phone'];
    $altPhone = $info['altPhone'];


    // format data
    ucwords($firstName);
    ucwords($lastName);

    //Tell PHPMailer to use SMTP
    $mail->isSMTP();

    //Enable SMTP debugging
    // 0 = off (for production use)
    // 1 = client messages
    // 2 = client and server messages
    $mail->SMTPDebug = 2;

    //Ask for HTML-friendly debug output
    $mail->Debugoutput = 'html';

    //Set the hostname of the mail server
    $mail->Host = 'smtp.gmail.com';
    // use
    // $mail->Host = gethostbyname('smtp.gmail.com');
    // if your network does not support SMTP over IPv6

    //Set the SMTP port number - 587 for authenticated TLS, a.k.a. RFC4409 SMTP submission
    $mail->Port = 587;

    //Set the encryption system to use - ssl (deprecated) or tls
    $mail->SMTPSecure = 'tls';

    //Whether to use SMTP authentication
    $mail->SMTPAuth = true;

    //Username to use for SMTP authentication - use full email address for gmail
    $mail->Username = "webmaster@summerinthecity.com";

    //Password to use for SMTP authentication
    $mail->Password = "sitc+2-0*0/2";

    //Set who the message is to be sent from
    $mail->setFrom('tech@summerinthecity.com', 'SITC Registration');

    // //Set an alternative reply-to address
    // $mail->addReplyTo('replyto@example.com', 'First Last');

    //Set who the message is to be sent to
    $mail->addAddress($email, $firstName . ' ' . $lastName);

    //Set the subject line
    $mail->Subject = "Don't forget to register for SITC";

    $message = "<html><body><div id='body' style='max-width: 600px; background-color:rgb(218, 217, 217); position: relative; padding: 10px'>";

    $message .= "<div id='imageContainer' style='max-width:600px; height: 125px; overflow: hidden; padding-top: 10px; margin: auto auto; position: relative'><img src='http://registration.summerinthecity.com/app/images/sidebar_toolbarBackground.jpg' style='max-width:600px; margin-top: -125px' /></div>";
    $message .= "<h3 style='font-family:Helvetica; opacity: .85'>We're glad you could join us today!</h3>";
    $message .= "<h4 style='font-family:Helvetica; opacity: .85'>Now make it official by filling out the registration form!</h4>";
    $message .= "<span style='font-family: Helvetica'>Hi, $firstName!</span>";
    $message .= "<span style='font-family: Helvetica'>&nbsp;We're glad you were able to join us today. Right now, your registration is only temporary. We look forward to seeing you again soon. Just be sure to fill out the registration form at the link below so that you're all set next time you show up at your nearest carpool site.</span>";
    $message .= "<a href='http://registration.summerinthecity.com' style='text-decoration: none'><div style=' width: 125px; height: 40px; background-color: rgb(85, 73, 142); border-radius: 10px; margin: auto auto; margin-top: 20px; '>";
    $message .= "<div style=' height: 40px; line-height: 40px; font-family: Helvetica; font-weight: 400; color: white; opacity: .85; text-align: center; margin: auto auto; position: relative'>Register</div></div></a>";
    $message .= "<div style='font-family: Helvetica;margin-top: 20px'><span>We can't wait to see you back at SITC soon!</span><br /><br /><span><em>The SITC Team</em></span></div>";
    $message .= "<hr style='margin-top: 30px'/>";
    $message .= "<table border='0' cellpadding='0' cellspacing='0' width='100%' id='templateFooter' style='font-family:Helvetica;'>";
    $message .= "<tr><td valign='top' class='footerContent' mc:edit='footer_content00'><a href='http://facebook.com/sitcDetroit'>Friend on Facebook</a></td></tr>";
    $message .= "<tr><td valign='top' class='footerContent' style='padding-top:0; padding-bottom:10px' mc:edit='footer_content01'><br /><em>Copyright &copy; 2017, Summer in the City, All rights reserved.</em><br /><br /><strong>Our mailing address is:</strong><br />1645 Clark Street<br />Detroit, MI 48209</td></tr>";
    $message .= "</table></div></body></html>";

    $mail->msgHTML($message);

    //send the message, check for errors
    if (!$mail->send()) {
        echo "Mailer Error: " . $mail->ErrorInfo;
    } else {
        echo "Message sent!";
    }
  }

?>

<?php

  function sanitize($var) {
    $clean_var = filter_var($var, FILTER_SANITIZE_STRING);
    return $clean_var;
  }

?>
