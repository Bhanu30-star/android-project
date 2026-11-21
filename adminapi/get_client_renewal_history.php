<?php

ob_start();

error_reporting(0);

include("../../connect.php");

date_default_timezone_set('Asia/Calcutta');



$currentDate = date("Y-m-d");

$currentTime = date("H:i:s");

$currentDateTime = date('Y-m-d H:i:s');



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



if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'fetchClientPayCloseHistory') {

    try {

        if (!isset($post['client_id'])) {

            throw new Exception('Missing client_id');
        }

        $session_dist_ver = $post['client_id'];
        $cdate  = date("Y-m-d");

        $res1 = mysqli_query($con, "SELECT next_renew_date,renew_popup_msg_avoid,currency_value from tbl_distributor where distributor_id='$session_dist_ver'");
        $renew_fetch = mysqli_fetch_assoc($res1);
        $renew_date = explode(" ", $renew_fetch['next_renew_date']);
        $renew_popup_msg = $renew_fetch['renew_popup_msg_avoid'];
        $r_date = strtotime($renew_date[0]);
        $mydate = date('Y-m-d', $r_date);
        $r2_date = strtotime("-3 day", $r_date);
        $d2_date = trim(date('Y-m-d', $r2_date));

        if ($cdate >= $d2_date && $cdate <= $mydate && $renew_popup_msg != $cdate) {

            $checkLastEntry = mysqli_query($con, "SELECT * FROM `tbl_client_renewal_history` WHERE client_id = '$session_dist_ver' AND DATE(popup_datetime) = '$cdate' AND skip_datetime = '0000-00-00 00:00:00' ORDER BY id DESC LIMIT 1");

            if (mysqli_num_rows($checkLastEntry) != 0) {
                $flag_popup = 1;
            } else {

                $checkLastEntry = mysqli_query($con, "SELECT * FROM `tbl_client_renewal_history` WHERE client_id = '$session_dist_ver' AND DATE(popup_datetime) = '$cdate' ORDER BY id DESC LIMIT 1");

                if (mysqli_num_rows($checkLastEntry) == 0) {
                    $renewHistory = mysqli_query($con, "INSERT INTO `tbl_client_renewal_history`(`client_id`, `popup_datetime`, `skip_datetime`, `renew_date`) VALUES ('$session_dist_ver', '$currentDateTime', '0000-00-00 00:00:00', '$mydate')");
                    $flag_popup = 1;
                } else {
                    $flag_popup = 0;
                }
            }

            // echo $flag_popup;die;
        }

        $getPopDetails = mysqli_query($con, "SELECT * FROM `tbl_client_renewal_history` WHERE client_id = '$session_dist_ver' 
        AND id != (SELECT MAX(id) FROM `tbl_client_renewal_history` WHERE client_id = '$session_dist_ver') 
        ORDER BY id DESC limit 7");

        if (mysqli_num_rows($getPopDetails) != 0) {

            $i = 1;

            foreach ($getPopDetails as $fetchDetails) {

                $popup_dt = ($fetchDetails['popup_datetime'] != '0000-00-00 00:00:00') ? date("d M Y H:i:s", strtotime($fetchDetails['popup_datetime'])) : '-';

                $skip_dt = ($fetchDetails['skip_datetime'] != '0000-00-00 00:00:00') ? date("d M Y H:i:s", strtotime($fetchDetails['skip_datetime'])) : '-';

                $clientRenewalHistory[] = [

                    'clientQueryId' => $i,

                    'subject' => $popup_dt,

                    'message' => $skip_dt,

                ];

                $i++;
            }

            echo json_encode(['status' => '1', 'data' => $clientRenewalHistory, 'message' => 'Done']);

            exit;
        } else {

            echo json_encode(['status' => '0', 'data' => null, 'message' => 'No Data found']);

            exit;
        }
    } catch (Exception $e) {

        echo json_encode(['status' => '0', 'data' => null, 'message' => 'General Error: ' . $e->getMessage()]);

        exit;
    }
}





if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'insertClientPayCloseHistory') {



    try {

        if (!isset($post['client_id'])) {

            throw new Exception('Missing client_id');
        }



        $client_id = $post['client_id'];



        $client_id = mysqli_real_escape_string($con, $client_id);



        $checkClientDetails = mysqli_query($con, "SELECT next_renew_date,renew_popup_msg_avoid,currency_value from tbl_distributor where distributor_id='$client_id'");



        if (mysqli_num_rows($checkClientDetails) != 0) {

            $fetchClientDetails = mysqli_fetch_assoc($checkClientDetails);



            $client_currency = $fetchClientDetails['currency_value'];

            $renew_date = explode(" ", $fetchClientDetails['next_renew_date']);

            $renew_popup_msg = $fetchClientDetails['renew_popup_msg_avoid'];

            $r_date = strtotime($renew_date[0]);

            $mydate = date('Y-m-d', $r_date);

            $r2_date = strtotime("-3 day", $r_date);

            $d2_date = trim(date('Y-m-d', $r2_date));



            if ($currentDate >= $d2_date && $currentDate <= $mydate && $renew_popup_msg != $currentDate) {



                $checkLastEntry = mysqli_query($con, "SELECT id FROM `tbl_client_renewal_history` WHERE client_id = '$client_id' ORDER BY id DESC LIMIT 1");

                $fetchLastEntry = mysqli_fetch_assoc($checkLastEntry);



                $updateHistory = mysqli_query($con, "UPDATE `tbl_client_renewal_history` SET `skip_datetime`='$currentDateTime' WHERE id = '$fetchLastEntry[id]' AND client_id = '$client_id'");

                $dist_updt_renew = mysqli_query($con, "UPDATE tbl_distributor SET renew_popup_msg_avoid = '$currentDate' WHERE distributor_id = '$client_id'");

                echo json_encode(['status' => 'success', 'data' => null, 'message' => 'Done']);

                exit;
            }
        } else {

            echo json_encode(['status' => 'error', 'data' => null, 'message' => 'Client not found']);

            exit;
        }
    } catch (Exception $e) {

        echo json_encode(['status' => 'error', 'data' => null, 'message' => 'General Error: ' . $e->getMessage()]);

        exit;
    }
}
