<?php
ob_start();
include("../../connect.php");

header("Content-Type: application/json");

// Handle JSON or Form-data input
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$contentType = strtolower(trim($contentType));

if (strpos($contentType, 'application/json') !== false) {
	$rawData = file_get_contents("php://input");
	$post = json_decode($rawData, true);

	if (json_last_error() !== JSON_ERROR_NONE || !is_array($post)) {
		echo json_encode(["success" => 0, "details" => "Invalid JSON input"]);
		exit;
	}
} else {
	$post = $_POST;
}

// Required parameters
$email1 = $post['email_id'] ?? '';
$pass = $post['password'] ?? '';
$otp = $post['otp'] ?? '';
$mac_id = $post['imei_no'] ?? '';
$device_id = $post['device_id'] ?? '';
$ip_address = $post['ip_address'] ?? '';
$carrier_name = $post['carrier_name'] ?? '';
$app_version = $post['app_version'] ?? '';
$phone_model = $post['phone_model'] ?? '';
$phone_manufacturer = $post['phone_manufacturer'] ?? '';
$sdk_phone_version = $post['sdk_phone_version'] ?? '';
$version_code = $post['version_code'] ?? '';

$response = [];

if (empty($email1) || empty($device_id) || empty($ip_address) || empty($carrier_name) || empty($mac_id) || empty($app_version) || empty($phone_model) || empty($phone_manufacturer) || empty($sdk_phone_version)) {
	$response['success'] = 0;
	$response['details'] = "Required fields missing.";
	echo json_encode($response);
	exit;
}

if ($version_code < 2) {
	$response['success'] = 0;
	$response['details'] = "New update available. Please update your app.";
	echo json_encode($response);
	exit;
}

if ($mac_id == "") {
	$response['success'] = 0;
	$response['details'] = "IMEI No not received. Please contact administrator!";
	echo json_encode($response);
	exit;
}

// Login logic
if (!empty($otp)) {
	// OTP-based login

	$disUserSql = mysqli_query($con, "SELECT * FROM `tbl_distributor_users` WHERE distributor_email = '$email1' OR phone_no = '$email1' AND status = 'Active' ORDER BY distributor_user_id DESC LIMIT 1");

	if (mysqli_num_rows($disUserSql) == 1) {

		$disUserRow = mysqli_fetch_array($disUserSql);

		$mobile_no = $disUserRow['phone_no'];

		$otpSql = mysqli_query($con, "SELECT *, CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM tbl_otp_history WHERE contact = '$mobile_no' AND otp = '$otp' AND is_verified = '1' ORDER BY id DESC LIMIT 1");

		if (mysqli_num_rows($otpSql) > 0) {
			$otpRow = mysqli_fetch_assoc($otpSql);
			if ($otpRow['otp_status'] == 'VALID') {
				$res = mysqli_query($con, "SELECT * FROM tbl_distributor_users WHERE phone_no = '$mobile_no' AND user_role='All' AND app_login='Yes' AND status='Active'");
			} else {
				$response['success'] = 0;
				$response['details'] = "OTP expired.";
				echo json_encode($response);
				exit;
			}
		} else {
			$response['success'] = 0;
			$response['details'] = "Invalid or unverified OTP.";
			echo json_encode($response);
			exit;
		}
	} else {
		$response['success'] = 0;
		$response['details'] = "Invalid UserId.";
		echo json_encode($response);
		exit;
	}
} elseif (!empty($pass)) {
	// Password-based login
	$res = mysqli_query($con, "SELECT * FROM tbl_distributor_users WHERE password='$pass' AND user_role='All' AND app_login='Yes' AND (distributor_email='$email1' OR phone_no='$email1') AND status='Active'");
	echo "3";
} else {
	$response['success'] = 0;
	$response['details'] = "Password or OTP is required.";
	echo json_encode($response);
	exit;
}

// Common login response
if (mysqli_num_rows($res) > 0) {
	$row = mysqli_fetch_assoc($res);
	$dis_user_id = $row['distributor_user_id'];

	// Log login event
	mysqli_query($con, "INSERT INTO tbl_distributor_users_login (distributor_user_id, distributor_id, distributor_name, password, phone_no, imei_no, ip_address, app_version, version_code)
        VALUES ('$dis_user_id', '{$row['distributor_id']}', '{$row['distributor_name']}', '{$row['password']}', '{$row['phone_no']}', '{$row['imei_no']}', '{$row['ip_address']}', '{$row['app_version']}', '{$row['version_code']}')");

	// Update device info
	mysqli_query($con, "UPDATE tbl_distributor_users SET imei_no='$mac_id', ip_address='$ip_address', carrier_name='$carrier_name', device_id='$device_id', app_version='$app_version', phone_model='$phone_model', phone_manufacturer='$phone_manufacturer', sdk_phone_version='$sdk_phone_version', version_code='$version_code' WHERE distributor_user_id='$dis_user_id'");

	$response['distributor_user_id'] = $row['distributor_user_id'];
	$response['distributor_id'] = $row['distributor_id'];
	$response['distributor_name'] = $row['distributor_name'];
	$response['distributor_email'] = $row['distributor_email'];
	$response['distributor_address'] = $row['distributor_address'];
	$response['distributor_phone'] = $row['phone_no'];

	// Distributor full details
	$res_dis = mysqli_query($con, "SELECT * FROM tbl_distributor WHERE distributor_id='{$row['distributor_id']}'");
	$row11 = mysqli_fetch_assoc($res_dis);

	$response += array(
		'gstin_no' => $row11['gstin_no'],
		'operator' => $row11['operator'],
		'state_code' => $row11['state_code'],
		'job_work' => $row11['job_work'],
		'doctorapp_type' => $row11['doctorapp_type'],
		'place_of_supply' => $row11['place_of_supply'],
		'milkman_type' => $row11['milkman_type'],
		'stone_crusher' => $row11['stone_crusher'],
		'jobwork_gst_configure' => $row11['jobwork_gst_configure'],
		'distributor_category' => $row11['distributor_category'],
		'distributor_logo' => $row11['image_path'],
		'code_no' => $row11['code_no'],
		'bank_name' => $row11['bank_name'],
		'sale_allowed' => $row11['sale_allowed'],
		'DLN_no' => $row11['DLN_no'],
		'pan_no' => $row11['pan_no'],
		'account_no' => $row11['account_no'],
		'branch' => $row11['branch'],
		'account_name' => $row11['account_name'],
		'ifsc_no' => $row11['ifsc_no'],
		'terms_of_delivery' => $row11['terms_of_delivery'],
		'price_editable_config' => $row11['price_editable_config'],
		'success' => 1,
		'details' => "Login successful"
	);
} else {
	$response['success'] = 0;
	$response['details'] = "Invalid login credentials.";
}

echo json_encode($response);
