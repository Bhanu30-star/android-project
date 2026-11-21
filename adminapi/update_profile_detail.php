<?php

include("../../connect.php");

$response = array();

if (isset($_POST['distributor_id'])) {

	$ver = $_POST['distributor_id'];

	$uname = mysqli_real_escape_string($con, $_POST['dname']);

	$uname_hindi = mysqli_real_escape_string($con, $_POST['dname_hindi']);

	$bdescription = mysqli_real_escape_string($con, $_POST['bdescription']);

	$uemail = mysqli_real_escape_string($con, $_POST['emailid']);

	$ugstin = mysqli_real_escape_string($con, $_POST['gstin']);

	$uaddress = mysqli_real_escape_string($con, $_POST['address']);

	$uaddress_hindi = mysqli_real_escape_string($con, $_POST['address_hindi']);

	$dpanno = mysqli_real_escape_string($con, $_POST['dpanno']);



	$bLogo = isset($_FILES['fileUpload']['name']) ? $_FILES['fileUpload']['name'] : '';

	if ($bLogo != "") {

		$temp1 = $_FILES['fileUpload']['tmp_name'];

		$fileData = pathinfo(basename($_FILES["fileUpload"]["name"]));

		$fileName = uniqid() . '.' . $fileData['extension'];

		$destination = "../distributor_logo/" . $fileName;

		move_uploaded_file($temp1, $destination);
	}

	$bqrcode = isset($_FILES['fileUploadqr']['name']) ? $_FILES['fileUploadqr']['name'] : '';

	if ($bqrcode != "") {

		$temp2 = $_FILES['fileUploadqr']['tmp_name'];

		$fileData1 = pathinfo(basename($_FILES["fileUploadqr"]["name"]));

		$fileName1 = uniqid() . '.' . $fileData1['extension'];

		$destination1 = "../distributor_qrcode/" . $fileName1;

		move_uploaded_file($temp2, $destination1);
	}

	date_default_timezone_set('Asia/Calcutta');

	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");

	if (mysqli_num_rows($disSql) > 0) {

		$disRow = mysqli_fetch_array($disSql);

		if ($disRow['country'] == 'United Arab Emirates')

			date_default_timezone_set('Asia/Dubai');
	}

	$cdate11  = date("Y-m-d") . " " . date("H:i:s");

	$placesupply_state = mysqli_real_escape_string($con, $_POST['placesupply']);

	if ($placesupply_state != '') {

		$place_supply_value = explode("#-#", $placesupply_state);

		$place_supply11 = trim($place_supply_value[0]);

		$place_supply12 = trim($place_supply_value[1]);
	}





	$error_msg = 0;

	if ($ugstin != '' && $place_supply11 != substr($ugstin, 0, 2)) {

		$error_msg = 1;
	}

	if ($error_msg == 0) {

		if ($placesupply_state != '') {

			$uq_state = mysqli_query($con, "update tbl_distributor set place_of_supply='$place_supply12',state_code='$place_supply11',gstin_no='$ugstin' where distributor_id='$ver'");
		}

		$rs_data11 = mysqli_query($con, "select * from tbl_distributor where distributor_id='$ver'");

		while ($fetch_dis_check11 = mysqli_fetch_assoc($rs_data11)) {

			$pname1 = $fetch_dis_check11['distributor_name'];

			$distri_email1 = $fetch_dis_check11['distributor_email'];

			$dis_phone = $fetch_dis_check11['phone_no'];

			$image_path = $fetch_dis_check11['image_path'];

			$QR_code = $fetch_dis_check11['QR_code'];

			$dis_address = mysqli_real_escape_string($con, $fetch_dis_check11['distributor_address']);

			$dis_gstin_no = $fetch_dis_check['gstin_no'];

			$dis_business_description = mysqli_real_escape_string($con, $fetch_dis_check11['business_description']);

			$pan_no = $fetch_dis_check11['pan_no'];

			$dis_address_hnd = mysqli_real_escape_string($con, $fetch_dis_check['distributor_adrs_hindi']);

			$pname_hnd1 = $fetch_dis_check['distributor_name_hindi'];

			$query = mysqli_query($con, "INSERT INTO `tbl_distributor_history`(`distributor_id`,`distributor_name`, `distributor_email`, `phone_no`, `distributor_address`,`gstin_no`,`insert_datetime_val`,`type_description`,`business_description`, `pan_no`, `image_path`,`QR_code`,`distributor_name_hindi`,`distributor_adrs_hindi`) VALUES ('$ver','$pname1','$distri_email1','$dis_phone', '$dis_address', '$dis_gstin_no','$cdate11','Profile Update','$dis_business_description','$pan_no','$image_path','$QR_code','$pname_hnd1','$dis_address_hnd')");

			if ($bLogo != "") {

				$uq2_logo = mysqli_query($con, "update tbl_distributor set image_path='$fileName' where distributor_id='$ver'");
			}

			if ($bqrcode != "") {

				$uq2_logo = mysqli_query($con, "update tbl_distributor set QR_code='$fileName1' where distributor_id='$ver'");
			}



			$uq1 = mysqli_query($con, "update tbl_distributor_users set distributor_email='$uemail',distributor_name='$uname', update_datetime='$cdate11',distributor_address='$uaddress',business_description='$bdescription',distributor_name_in_hindi='$uname_hindi',distributor_adrs_hindi='$uaddress_hindi' where distributor_id='$ver' and user_role='All' and app_login='Yes'");



			$uq2 = mysqli_query($con, "update tbl_distributor set distributor_email='$uemail',distributor_name='$uname', update_datetime='$cdate11',distributor_address='$uaddress',business_description='$bdescription',pan_no='$dpanno', distributor_name_hindi='$uname_hindi',distributor_adrs_hindi='$uaddress_hindi' where distributor_id='$ver'");



			$response['success'] = '1';

			$response['message'] = "Profile Successfully Updated";
		}
	} else {

		$response['success'] = '0';

		$response['message'] = "Your GSTIN is not Regestered with selected State!!";
	}
} else {

	$response['success'] = '0';

	$response['details'] = "Required field missing";
}

echo json_encode($response);
