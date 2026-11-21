<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
include("../../connect.php");
$response = array();
if (isset($_POST['distributor_id']) && isset($_POST['oldpass']) && isset($_POST['newpass']) && isset($_POST['distributor_user_id'])) {
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d") . " " . date("H:i:s");
	$dis_user_id = $_POST['distributor_user_id'];

	$oldpass = $_POST['oldpass'];
	$newpass = $_POST['newpass'];
	$rs = mysqli_query($con, "select distributor_user_id from tbl_distributor_users where distributor_user_id='$dis_user_id' and password ='$oldpass'");
	$num = mysqli_num_rows($rs);
	if ($num > 0) {

		$rs_data = mysqli_query($con, "select * from tbl_distributor_users where distributor_user_id='$dis_user_id'");
		while ($fetch_dis_check = mysqli_fetch_assoc($rs_data)) {
			$pname1 = $fetch_dis_check['distributor_name'];
			$distri_email1 = $fetch_dis_check['distributor_email'];
			$dis_password = $fetch_dis_check['password'];
			$dis_phone = $fetch_dis_check['phone_no'];
			$dis_address = $fetch_dis_check['distributor_address'];
			$dis_gstin_no = $fetch_dis_check['gstin_no'];
			$query = mysqli_query($con, "INSERT IGNORE INTO `tbl_distributor_history`(`distributor_id`,`distributor_user_id`, `password`, `distributor_name`, `distributor_email`, `phone_no`, `distributor_address`, `gstin_no`,`insert_datetime_val`,`type_description`) VALUES ('$ver','$dis_user_id','$dis_password','$pname1','$distri_email1','$dis_phone','$dis_address','$dis_gstin_no','$cdate11','Password Changed')");
		}

		$uq1 = mysqli_query($con, "update tbl_distributor_users set password='$newpass',update_datetime='$cdate11',imei_no='',session_id='' where distributor_user_id='$dis_user_id'");
		$response['success'] = '1';
		$response['details'] = "Password changed successfully";
	} else {
		$response['success'] = '0';
		$response['details'] = "Password not changed..Please check and try again later!!";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
