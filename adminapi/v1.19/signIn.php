<?php
ob_start();
error_reporting(0);
include("../../../connect.php");
session_start();
// include("../../distributor-session-check-btprime.php");
date_default_timezone_set('Asia/Calcutta');

$currentDate = date("Y-m-d");
$currentTime = date("H:i:s");

$currentMonth = date('Y-m');
$monthStarting = $currentMonth . '-01';

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
    $rawData = file_get_contents("php://input");

    $post = json_decode($rawData, true);

    if ($post === null) {
        echo json_encode(["error" => "Invalid JSON received"]);
        exit;
    }
} elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
    $post = $_POST;
} else {
    $post = $_POST;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($post['type']) && $post['type'] == 'sendSignUpOtpReq') {

    if (!isset($post['mobile_no']) || !isset($post['country'])) {
        echo json_encode(['status' => 0, 'message' => 'Invalid input', 'contactEmail' => '', 'contactName' => '', 'contactType' => '']);
        exit();
    }

    $mobile_no = mysqli_real_escape_string($con, trim($post['mobile_no']));
    $country_name = mysqli_real_escape_string($con, trim($post['country']));

    $email_check = '';
    $mobile_check = '';

    if (filter_var($mobile_no, FILTER_VALIDATE_EMAIL)) {
        $email_check = $mobile_no;
    } elseif (preg_match('/^\d{10}$/', $mobile_no)) {
        $mobile_check = $mobile_no;
    }

    $res_check_user = mysqli_query($con, "SELECT * from `tbl_distributor_users` WHERE (distributor_email='$mobile_no' or phone_no='$mobile_no') and status='Active'");
    if (mysqli_num_rows($res_check_user) > 0) {
        while ($fetch_user = mysqli_fetch_assoc($res_check_user)) {
            $mobile_no = $fetch_user['phone_no'];
            $contact_email = $fetch_user['distributor_email'];
            if ($fetch_user['legal_name'] != '')
                $contact_name = $fetch_user['legal_name'];
            else
                $contact_name = $fetch_user['distributor_name'];
            $contact_type = 'Admin';
        }
    } else {
        $res_check_user_fse = mysqli_query($con, "SELECT * FROM `tbl_user` WHERE (user_phone='$mobile_no' or user_email='$mobile_no') and status='Active'");
        if (mysqli_num_rows($res_check_user_fse) > 0) {
            while ($fetch_user = mysqli_fetch_assoc($res_check_user_fse)) {
                $mobile_no = $fetch_user['user_phone'];
                $contact_email = $fetch_user['user_email'];
                $contact_name = $fetch_user['user_name'];
                $contact_type = $fetch_user['user_working_type'];
            }
        } else {
            $res_check_user_party = mysqli_query($con, "SELECT * FROM `tbl_party` WHERE party_phone='$mobile_no' limit 1");
            if (mysqli_num_rows($res_check_user_party) > 0) {
                while ($fetch_user = mysqli_fetch_assoc($res_check_user_party)) {
                    $mobile_no = $fetch_user['party_phone'];
                    $contact_email = $fetch_user['party_email'];
                    $contact_name = $fetch_user['party_name'];
                    $contact_type = 'Retailer';
                }
            } 
            // else {
            //     echo json_encode(['status' => 0, 'message' => 'Invalid input']);
            //     exit();
            // }
        }
    }
    $otp = mt_rand(100000, 999999);

    // echo $otp;
    // echo '<br>';
    // echo $mobile_no.'num';
    // echo '<br>';
    // echo $email_check.'email';
    // echo '<br>';
    // echo $mobile_check.'new num';die;

    if ($email_check != '') {
        $to = $email_check;
        $subject = "Your BTHAWK+ OTP for Verification";

        $user_mail_body = "
                            <html>
                            <head>
                            <meta charset='UTF-8'>
                            </head>
                            <body style='font-family: Arial, sans-serif; color: #333;'>
                            <p>Dear <strong>$contact_name</strong>,</p>

                            <p>Your One-Time Password (OTP) for verifying your identity on <strong>BTHAWK+</strong> is:</p>

                            <p style='font-size: 20px; font-weight: bold; color: #2c3e50;'>🔐 OTP: $otp</p>

                            <p>This OTP is valid for the next <strong>10 minutes.</strong> Please do not share it with anyone for security reasons.</p>

                            <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>

                            <p>Thank you for using <strong>BTHAWK+</strong>.</p>

                            <br>
                            <p>Best regards,<br>
                            <strong>Team BTHAWK+</strong><br>
                            <a href='https://www.bthawk.in'>www.bthawk.in</a><br>
                            Support: <a href='mailto:support@bthawk.in'>support@bthawk.in</a></p>
                            </body>
                            </html>
                            ";

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: BTHAWK+ <info@bthawk.pro>\r\n";

        mail($to, $subject, $user_mail_body, $headers);
    }

    $request_id = '';

    if ($email_check == '') {
        if ($country_name == 'India') {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.msg91.com/api/v5/otp?template_id=63b81670d6fc054e4f39fe43&mobile=91' . $mobile_no . '&authkey=387502ATd2tyowCg63abef8dP1&otp=' . $otp . '&otp_expiry=10',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array(
                    'Cookie: PHPSESSID=ghvvvi1ic60r2pdv065oppn4m1'
                ),
            ));
            $response = curl_exec($curl);
            curl_close($curl);

            $result = json_decode($response);
            if (isset($result->type)) {
                $request_id = $result->request_id;
            }
        }
    }

    $currentDateTime = date('Y-m-d H:i:s');

    $updateOTPSql = mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '3' WHERE contact = '$mobile_no' AND is_verified = '1'");

    $insertOTPSql = mysqli_query($con, "INSERT INTO `tbl_otp_history`(`request_id`, `otp`, `contact`, `email`, `country`, `source`, `is_verified`, `inserted_at`) VALUES ('$request_id','$otp','$mobile_check','$email_check','$country_name','Web','1','$currentDateTime')");

    $arrayToSend = [
        "countryCode" => '+91',
        "phoneNumber" => $mobile_no,
        "callbackData" => "Message Send",
        "type" => "Template",
        "template" => [
            "bodyValues" => [$otp],
            "name" => "bthawk_smile",
            "languageCode" => "en"
        ]
    ];

    $url = "https://api.interakt.ai/v1/public/message/";
    $apiKey = "Basic aWlMOEFiVHFFcmpWWG8wQUlHbkZzUUtINm5lc2p3djVzbkVfTVRqa0xTNDo=";
    $message_for = "OTP Code";

    $json = json_encode($arrayToSend);
    $headers = [
        'Content-Type: application/json',
        'Authorization: ' . $apiKey
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    $resultRes = json_decode($response);
    if (isset($resultRes->id) && isset($resultRes->result)) {
        $message_id = $resultRes->id;
        $status = $resultRes->result;
        $retData = ['status' => 1, 'details' => 'WhatsApp message sent successfully'];
        $insertSql = mysqli_query($con, "INSERT INTO `whatsapp_api_response`(`mobile_no`, `message_id`, `message_for`, `message_status`) VALUES ('$mobile_no', '$message_id', '$message_for', '$status')");
        if (!$insertSql) {
            echo json_encode(['status' => 0, 'message' => 'Database error']);
            exit();
        }
    }

    $otpResult = [
        'status' => 'success',
        'message' => 'OTP Sent Successfully',
        'contactEmail' => $contact_email,
        'contactName' => $contact_name,
        'contactType' => $contact_type,
        'contactMobile' => $mobile_no,
    ];
    echo json_encode($otpResult);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($post['type']) && $post['type'] == 'veryfyOtpForgotPassword') {

    if (!isset($post['mobile_no']) || !isset($post['otp'])) {
        echo json_encode(['status' => 0, 'message' => 'Invalid input']);
        exit();
    }

    $mobile_no = mysqli_real_escape_string($con, trim($post['mobile_no']));
    $otp = mysqli_real_escape_string($con, trim($post['otp']));

    if (filter_var($mobile_no, FILTER_VALIDATE_EMAIL)) {
        $email_check = $mobile_no;
    } elseif (preg_match('/^\d{10}$/', $mobile_no)) {
        $mobile_check = $mobile_no;
    }

    $otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact = '$mobile_check' OR email = '$email_check') AND otp = '$otp' AND is_verified = '1'");

    if (mysqli_num_rows($otpCheckSql) > 0) {

        $otpCheckData = mysqli_fetch_assoc($otpCheckSql);
        if ($otpCheckData['otp_status'] == 'VALID') {

            mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE (contact = '$mobile_check' OR email = '$email_check')");

            echo json_encode(['status' => 1, 'message' => 'OTP Verified']);
            exit();
        } else {
            echo json_encode(['status' => 0, 'message' => 'Otp is Expired!']);
            exit();
        }
    } else {
        echo json_encode(['status' => 0, 'message' => 'Otp is Invalid!']);
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($post['type']) && $post['type'] == 'changePassword') {

    if (!isset($post['mobile_no']) || empty(trim($post['mobile_no']))) {
        echo json_encode(['status' => 0, 'message' => 'Mobile number is required']);
        exit();
    }

    if (!isset($post['password']) || empty(trim($post['password']))) {
        echo json_encode(['status' => 0, 'message' => 'Password is required']);
        exit();
    }

    $password = trim($post['password']);
    if (strlen($password) < 5) {
        echo json_encode(['status' => 0, 'message' => 'Password must be at least 5 characters']);
        exit();
    }

    $mobile_no = mysqli_real_escape_string($con, trim($post['mobile_no']));
    $password  = mysqli_real_escape_string($con, $password);

    $email_check = "";
    $mobile_check = "";

    if (filter_var($mobile_no, FILTER_VALIDATE_EMAIL)) {
        $email_check = $mobile_no;
    } elseif (preg_match('/^\d{10}$/', $mobile_no)) {
        $mobile_check = $mobile_no;
    } else {
        echo json_encode(['status' => 0, 'message' => 'Invalid mobile number or email']);
        exit();
    }

    $checkUser = mysqli_query($con, "SELECT * FROM `tbl_distributor_users` WHERE (phone_no = '$mobile_check' OR distributor_id = '$email_check')");

    if (mysqli_num_rows($checkUser) != 0) {

        $updatePassword = mysqli_query($con, "UPDATE `tbl_distributor_users` SET password = '$password' WHERE (phone_no = '$mobile_check' OR distributor_id = '$email_check')");

        if ($updatePassword) {
            echo json_encode(['status' => 1, 'message' => 'Password updated successfully!']);
            exit();
        } else {
            echo json_encode(['status' => 0, 'message' => 'Something went wrong while updating password!']);
            exit();
        }
    } else {
        echo json_encode(['status' => 0, 'message' => 'User not found!']);
        exit();
    }
}

function getRealIP()
{
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

function getIPLatLng()
{
    $url = "http://ip-api.com/json";
    $response = file_get_contents($url);
    $data = json_decode($response);


    if (isset($data->lat) && isset($data->lon)) {
        return ['latitude' => $data->lat, 'longitude' => $data->lon];
    } else {
        return null;
    }
}
