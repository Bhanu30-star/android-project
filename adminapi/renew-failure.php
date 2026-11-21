<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include("../../connect.php");

// require_once __DIR__ . '/../../vendor/autoload.php';

// use PHPMailer\PHPMailer\PHPMailer;
// use PHPMailer\PHPMailer\Exception;

$response = array();
if (isset($_POST['distributor_id'])) {
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");
	$da  = date("Y-m-d");
	$scri = $da . ' ' . $scro;

	$status = $_POST["status"];
	$month_value = $_POST["month"];
	$gst_amount = $_POST["gst_amount"];
	$amount = $_POST["amount"];
	$taxable_amt = $amount - $gst_amount;
	$txnid = $_POST["txnid"];
	$payment_plan = $_POST["payment_plan"];
	$payment_type = $_POST["payment_type"];

	$gst_amount2 = $gst_amount;
	$amount2 = $amount;
	$taxable_amt2 = $taxable_amt;

	$host = gethostname();
	$ip = gethostbyname($host);
	$mac_id = $ip;
	$time = microtime();
	$t = substr($time, -4);
	$abtxid = "BTTX" . $ver . "U" . $t;
	$insert_transaction = mysqli_query($con, "INSERT INTO tbl_bt_transaction(bt_txn_id,transaction_date,transaction_time,distributor_id,transaction_id,gst_amount,transaction_amount,txn_status,txn_type,plan_type,month,payment_type,source)VALUES('$abtxid','$da','$scro','$ver','$txnid','$gst_amount','$amount','Failure', 'Renew','$payment_plan','$month_value','$payment_type','App')");

	$fetchwpq = mysqli_query($con, "SELECT  * from tbl_distributor WHERE distributor_id='$ver'");
	if ($fetchwpq) {
		while ($fetchrow = mysqli_fetch_assoc($fetchwpq)) {
			extract($fetchrow);
			$flag = 0;
			$id = $distributor_id;
			$fetch_dist = mysqli_query($con, "SELECT  * from tbl_user WHERE distributor_id='$id' and status in ('Active','Deactive')");
			$no_users = mysqli_num_rows($fetch_dist);
			$uname = ucwords($distributor_name);
			$email = $distributor_email;
			$phoneuser = $phone_no;
			$regtime = $next_renew_date;
			$dist_zone = $Zone;
			$date = strtotime($regtime);
			$h = date('h', $date);
			date_default_timezone_set('Asia/Calcutta');
			$scro = date("h:i:sa");
			$da  = date("Y-m-d");
			$scri = $da . ' ' . $scro;
			$amount = $_POST["amount"];

			$registration_date_of_bth = $registration_datetime;
			$gstin = $gstin_no;
			$location = $place_of_supply;

			$registration_date_of_bth2 = $registration_datetime;
			$gstin2 = $gstin_no;
			$location2 = $place_of_supply;

			include("../pay/sendmail-failure-renew.php");
			$d_link = "https://www.bthawk.appexperts.net/";
			$prod_name = "BTHAWK";
			$sendmail = new SendMail();
			$res = $sendmail->sendMailUser($gst_amount, $taxable_amt, $registration_date_of_bth, $gstin, $location, $email, $uname, $prod_name, $scri, $d_link, $amount, $phoneuser, $dist_zone, $id, $payment_type, $month_value, $no_users);
			$adminmail = "bthawk@belltechnology.in";
			//$adminmail="shilpa.khandelwal@belltechnology.in";

			$sd_link = "https://www.bthawk.appexperts.net/";

			$sendmailadmin = new SendMail();
			$result_admin = $sendmailadmin->sendmailAdmin($amount2, $gst_amount2, $taxable_amt2, $registration_date_of_bth2, $gstin2, $location2, $adminmail, $email, $uname, $prod_name, $scri, $d_link, $phoneuser, $dist_zone, $id, $payment_type, $month_value, $no_users);
		}
	}
	if ($res == 1 and $result_admin == 1) {
		$response['success'] = '1';
		$response['message'] = "Mail send successfully";
	} else {
		$response['success'] = '0';
		$response['message'] = "Mail not send";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
