<?php
ob_start();
include("../../../connect.php");

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

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($post['type']) && $post['type'] == 'userLogin') {

	$device_id= $mac_id = $post['imei_no'];
	$email1 = $post['email_id'];
	$pass = $post['password'];
	$otp = $post['otp'];
	$ip_address = $carrier_name = $phone_model = $phone_manufacturer = $sdk_phone_version = '';
	$app_version=$version_code = isset($post['version_code']) ? $post['version_code'] : '';


		if ($mac_id == "") {

			$response['success'] = 0;
			$response['details'] = "IMEI No. not received. Please contact administrator!!";
		} else {

			if ($pass != '') {

				$res = mysqli_query($con, "SELECT * from `tbl_distributor_users` WHERE password='$pass' AND user_role='All' and app_login='Yes' and (distributor_email='$email1' or phone_no='$email1') and status='Active'");


				$response = array();

				if (mysqli_num_rows($res) > 0) {

					$row = mysqli_fetch_assoc($res);

					$password = $row['password'];

					// if ($password == $pass) {

					$response['user_id'] = $row['distributor_user_id'];
					$dis_id = $row['distributor_user_id'];
					$response['user_type'] = 'Admin';

					$query_message = mysqli_query($con, "INSERT INTO `tbl_distributor_users_login`(`distributor_user_id`, `distributor_id`, `distributor_name`, `password`, `phone_no`, `imei_no`, `ip_address`, `app_version`, `version_code`) VALUES ('$dis_id','" . $row['distributor_id'] . "','" . $row['distributor_name'] . "','" . $row['password'] . "','" . $row['phone_no'] . "','" . $row['imei_no'] . "','" . $row['ip_address'] . "','" . $row['app_version'] . "','" . $row['version_code'] . "')");

					$que2 = mysqli_query($con, "update tbl_distributor_users set imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',device_id='$device_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',version_code='$version_code' where distributor_user_id='$dis_id'");
					$response['distributor_id'] = $row['distributor_id'];
					$response['distributor_name'] = $row['distributor_name'];
					$response['distributor_email'] = $row['distributor_email'];
					$response['distributor_phone'] = $row['phone_no'];

					$dis_id = $row['distributor_id'];
					$res_dis = mysqli_query($con, "Select * from tbl_distributor where distributor_id='$dis_id'");
					$row11 = mysqli_fetch_assoc($res_dis);
					$response['state_code'] = $row11['state_code'];
					$response['job_work'] = $row11['job_work'];
					$response['doctorapp_type'] = $row11['doctorapp_type'];
					$response['place_of_supply'] = $row11['place_of_supply'];
					$response['milkman_type'] = $row11['milkman_type'];
					$response['stone_crusher'] = $row11['stone_crusher'];
					$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
					$response['distributor_logo'] = $row11['image_path'];
					
					$response['success'] = 1;
					$response['details'] = "Data Success";
					$response['isResgister'] = 1;
				} else {

					$res = mysqli_query($con, "SELECT * from `tbl_user` WHERE user_password = '$pass' AND (user_phone='$email1' or user_email='$email1') and status='Active'");
					$response = array();
					if (mysqli_num_rows($res) > 0) {
						$row = mysqli_fetch_assoc($res);
						$password = $row['user_password'];
						$temp_device_id = $row['imei_no'];
						if (($temp_device_id == "") || ($temp_device_id == $mac_id)) {

							$temp_uid = $row['user_id'];
							$dis_id = $row['distributor_id'];
							$response['user_id'] = $row['user_id'];
							$response['user_type'] = $row['user_working_type'];
							$query_message = mysqli_query($con, "INSERT INTO `tbl_user_history`(`user_id`, `user_name`, `app_version`, `version_code`, `work_type`, `invoice_type`, `password`, `imei_no`,`saleorder_setting`, `e_recharge_setting`, `ip_address`, `carrier_name`, `type`) VALUES ('$temp_uid','" . $row['user_name'] . "','" . $row['app_version'] . "','" . $row['version_code'] . "','" . $row['work_type'] . "','" . $row['invoice_type'] . "','" . $row['password'] . "','" . $row['imei_no'] . "','" . $row['saleorder_setting'] . "','" . $row['e_recharge_setting'] . "','" . $row['ip_address'] . "','" . $row['carrier_name'] . "','FSE LOGIN')");
							$que2 = mysqli_query($con, "update tbl_user set imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',device_id='$device_id',version_code='$version_code' where user_id='$temp_uid' and distributor_id='$dis_id'");
							$response['username'] = $row['user_name'];
							$response['party_creation'] = $row['party_creation'];
							$res11 = mysqli_query($con, "Select * from tbl_distributor where distributor_id='$dis_id'");
							$row11 = mysqli_fetch_assoc($res11);
							
							$response['distributor_id'] = $row11['distributor_id'];
							$response['distributor_name'] = $row11['distributor_name'];
							$response['distributor_email'] = $row11['distributor_email'];
							$response['distributor_address'] = $row11['distributor_address'];
							$response['distributor_phone'] = $row11['phone_no'];
							$response['distributor_mobile'] = $row11['mobile_no'];
							
							$response['fabrics_receipt'] = $row11['fabrics_receipt'];
							$response['AGRO_type'] = $row11['AGRO_type'];
							$response['job_work'] = $row11['job_work'];
							$response['milkman_type'] = $row11['milkman_type'];
							$select_operator = mysqli_query($con, "select * from tbl_distributor_operator_master,tbl_circle_master,tbl_operator_master where tbl_distributor_operator_master.circle_id = tbl_circle_master.circle_id and tbl_distributor_operator_master.operator_id = tbl_operator_master.operator_id and tbl_distributor_operator_master.distributor_id='$dis_id'");
							$operator_detail = array();
							while ($fetch_operator = mysqli_fetch_array($select_operator)) {
								$operator_detail['circle_operator_id'] = $fetch_operator['circle_operator_id'];
								$operator_detail['circle_name'] = $fetch_operator['circle_name'];
								$operator_detail['operator_name'] = $fetch_operator['operator_name'];
								$operator_detail['commission_rate'] = $fetch_operator['commission_rate'];
								$operator_detail['sender_id'] = $fetch_operator['sender_id'];
								$response['operator_detail'][] = $operator_detail;
							}
							$response['operator'] = $row11['operator'];
							$response['distributor_logo'] = $row11['image_path'];
							$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
							$response['place_of_supply'] = $row11['place_of_supply'];
							$select_user = mysqli_query($con, "select * from tbl_state_master where state_name='" . $row11['place_of_supply'] . "'");
							if (mysqli_num_rows($select_user) > 0) {
								while ($fetch_user = mysqli_fetch_array($select_user)) {
									$response['party_code'] = $fetch_user['state_code'];
								}
							} else {
								$response['party_code'] = '';
							}
							$response['code_no'] = $row11['code_no'];
							
							$response['user_phone'] = $row['user_phone'];
							$response['user_email'] = $row['user_email'];
							
							$response['distributor_category'] = $row11['distributor_category'];
							$response['signature_requirement'] = $row11['signature_requirement'];
							$work_type = $row['work_type'];
							if ($row['e_recharge_setting'] == "Yes") {
								$work_type = $work_type . "+" . "E-Recharge";
							}
							if ($row11['AGRO_type'] == "Yes") {
								$work_type = $work_type . "+" . "AGRO";
							}
							if ($row['saleorder_setting'] == "Yes") {
								$work_type = $work_type . "+" . "SaleOrder_Setting";
							}

							$response['fse_type'] = $work_type;
							$response['success'] = 1;
							$response['details'] = "Data Success";
							$response['isResgister'] = 1;
						} else {
							$response['success'] = 0;
							$response['details'] = "You are already logged in. Please logout from another device or contact distributor!!";
						}
					} else if ($pass != '' && $email1 != '') {

						$res = mysqli_query($con, "SELECT * FROM `tbl_party` WHERE password = '$pass' AND party_phone='$email1' limit 1");

						$response = array();

						if (mysqli_num_rows($res) > 0) {

							$row = mysqli_fetch_assoc($res);

							$password = $row['password'];
							$distributor_id = $row['distributor_id'];
							$select_distributor = mysqli_query($con, "SELECT distributor_category from tbl_distributor where distributor_id='$distributor_id'");
							$fetch_distributor = mysqli_fetch_assoc($select_distributor);
							$que2 = mysqli_query($con, "update tbl_party set imei_no='$mac_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',ip_address='$ip_address',device_id='$device_id' where party_phone='$email1'");
							$response['distributor_work_type'] = $fetch_distributor['distributor_category'];
							$response['party_id'] = $row['party_id'];
							$response['party_name'] = $row['party_name'];
							$response['party_phone'] = $row['party_phone'];
							$response['party_email'] = $row['party_email'];
							
							$response['place_of_supply'] = $row['place_of_supply'];
							$response['state_name'] = $row['state_name'];
							$response['party_code'] = $row['party_code'];
							$response['user_type'] = 'Retailer';
							$response['stock_request'] = $row['stock_request'];
							if ($row['party_phone'] == $row['password']) {
								$response['password_change_flag'] = 'Yes';
							} else {
								$response['password_change_flag'] = 'No';
							}


							$dist_detail = mysqli_query($con, "SELECT *,tbl_distributor.distributor_id as distid FROM tbl_distributor,tbl_party where tbl_distributor.distributor_id=tbl_party.distributor_id and tbl_party.party_phone like '%$email1%' group by tbl_distributor.distributor_id");
							$client_list = array();
							if (mysqli_num_rows($dist_detail) > 0) {
								while ($fetch_client = mysqli_fetch_assoc($dist_detail)) {
									$client_list['retailer_id'] = $fetch_client['party_id'];
									$client_list['distributor_id'] = $fetch_client['distid'];
									$client_list['distributor_name'] = $fetch_client['distributor_name'];
									$client_list['phone_no'] = $fetch_client['phone_no'];
									$response['client_list'][] = $client_list;
								}
							} else {
								$response['client_list'] = $client_list;
							}


							$response['success'] = 1;
							$response['details'] = "Data Success";
							$response['isResgister'] = 1;
						} else {
							$response['success'] = 0;
							$response['details'] = "Your password or mail id or phone number is not correct !";
							$response['isResgister'] = 0;
						}
					} else {
						$response['success'] = 0;
						$response['details'] = "Your password or mail id or phone number is not correct !";
						$response['isResgister'] = 0;
					}
				}
			} else {
				
				
				$res = mysqli_query($con, "SELECT * from `tbl_distributor_users` WHERE user_role='All' and app_login='Yes' and (distributor_email='$email1' or phone_no='$email1') and status='Active'");


				$response = array();

				if (mysqli_num_rows($res) > 0) {

					$row = mysqli_fetch_assoc($res);

					$mobile_no = $row['phone_no'];

					$otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact='$email1' or email='$email1') AND otp = '$otp' AND is_verified = '1'");

					if (mysqli_num_rows($otpCheckSql) > 0) {

						$otpCheckData = mysqli_fetch_assoc($otpCheckSql);
						if ($otpCheckData['otp_status'] == 'VALID') {

							mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE (contact='$email1' or email='$email1')");

							$response['user_id'] = $row['distributor_user_id'];
							$dis_id = $row['distributor_user_id'];
							$response['user_type'] = 'Admin';

							$query_message = mysqli_query($con, "INSERT INTO `tbl_distributor_users_login`(`distributor_user_id`, `distributor_id`, `distributor_name`, `password`, `phone_no`, `imei_no`, `ip_address`, `app_version`, `version_code`) VALUES ('$dis_id','" . $row['distributor_id'] . "','" . $row['distributor_name'] . "','" . $row['password'] . "','" . $row['phone_no'] . "','" . $row['imei_no'] . "','" . $row['ip_address'] . "','" . $row['app_version'] . "','" . $row['version_code'] . "')");

							$que2 = mysqli_query($con, "update tbl_distributor_users set imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',device_id='$device_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',version_code='$version_code' where distributor_user_id='$dis_id'");
							$response['distributor_id'] = $row['distributor_id'];
							$response['distributor_name'] = $row['distributor_name'];
							$response['distributor_email'] = $row['distributor_email'];
							$response['distributor_phone'] = $row['phone_no'];

							$dis_id = $row['distributor_id'];
							$res_dis = mysqli_query($con, "Select * from tbl_distributor where distributor_id='$dis_id'");
							$row11 = mysqli_fetch_assoc($res_dis);
							
							$response['state_code'] = $row11['state_code'];
							$response['job_work'] = $row11['job_work'];
							$response['doctorapp_type'] = $row11['doctorapp_type'];
							$response['place_of_supply'] = $row11['place_of_supply'];
							$response['milkman_type'] = $row11['milkman_type'];
							$response['stone_crusher'] = $row11['stone_crusher'];
							$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
							$response['distributor_category'] = $row11['distributor_category'];
							$response['distributor_logo'] = $row11['image_path'];
							$response['success'] = 1;
							$response['details'] = "Data Success";
							$response['isResgister'] = 1;
						} else {
							$response['success'] = 0;
							$response['details'] = "OTP Expired";
						}
					} else {
						$response['success'] = 0;
						$response['details'] = "Invalid OTP";
					}
				} else {

					$res = mysqli_query($con, "SELECT * FROM `tbl_user` WHERE (user_phone='$email1' or user_email='$email1') and status='Active'");

					$response = array();

					if (mysqli_num_rows($res) > 0) {

						$row = mysqli_fetch_assoc($res);

						$mobile_no = $row['user_phone'];

						$otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact='$email1' or email='$email1') AND otp = '$otp' AND is_verified = '1'");

						if (mysqli_num_rows($otpCheckSql) > 0) {

							$otpCheckData = mysqli_fetch_assoc($otpCheckSql);
							if ($otpCheckData['otp_status'] == 'VALID') {

								mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE (contact='$email1' or email='$email1')");

								$temp_device_id = $row['imei_no'];

								if (($temp_device_id == "") || ($temp_device_id == $mac_id)) {

									$temp_uid = $row['user_id'];
									$dis_id = $row['distributor_id'];
									$response['user_id'] = $row['user_id'];
									$response['user_type'] = $row['user_working_type'];
									$query_message = mysqli_query($con, "INSERT INTO `tbl_user_history`(`user_id`, `user_name`, `app_version`, `version_code`, `work_type`, `invoice_type`, `password`, `imei_no`,`saleorder_setting`, `e_recharge_setting`, `ip_address`, `carrier_name`, `type`) VALUES ('$temp_uid','" . $row['user_name'] . "','" . $row['app_version'] . "','" . $row['version_code'] . "','" . $row['work_type'] . "','" . $row['invoice_type'] . "','" . $row['password'] . "','" . $row['imei_no'] . "','" . $row['saleorder_setting'] . "','" . $row['e_recharge_setting'] . "','" . $row['ip_address'] . "','" . $row['carrier_name'] . "','FSE LOGIN')");
									$que2 = mysqli_query($con, "update tbl_user set imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',device_id='$device_id',version_code='$version_code' where user_id='$temp_uid' and distributor_id='$dis_id'");
									$response['username'] = $row['user_name'];
									$response['party_creation'] = $row['party_creation'];
									$res11 = mysqli_query($con, "Select * from tbl_distributor where distributor_id='$dis_id'");
									$row11 = mysqli_fetch_assoc($res11);
									
									$response['distributor_id'] = $row11['distributor_id'];
									$response['distributor_name'] = $row11['distributor_name'];
									$response['distributor_email'] = $row11['distributor_email'];
									$response['distributor_phone'] = $row11['phone_no'];
									$response['distributor_mobile'] = $row11['mobile_no'];
									$response['AGRO_type'] = $row11['AGRO_type'];
									$response['job_work'] = $row11['job_work'];
									$response['milkman_type'] = $row11['milkman_type'];
									$select_operator = mysqli_query($con, "select * from tbl_distributor_operator_master,tbl_circle_master,tbl_operator_master where tbl_distributor_operator_master.circle_id = tbl_circle_master.circle_id and tbl_distributor_operator_master.operator_id = tbl_operator_master.operator_id and tbl_distributor_operator_master.distributor_id='$dis_id'");
									$operator_detail = array();
									while ($fetch_operator = mysqli_fetch_array($select_operator)) {
										$operator_detail['circle_operator_id'] = $fetch_operator['circle_operator_id'];
										$operator_detail['circle_name'] = $fetch_operator['circle_name'];
										$operator_detail['operator_name'] = $fetch_operator['operator_name'];
										$operator_detail['commission_rate'] = $fetch_operator['commission_rate'];
										$operator_detail['sender_id'] = $fetch_operator['sender_id'];
										$response['operator_detail'][] = $operator_detail;
									}
									$response['operator'] = $row11['operator'];
									$response['distributor_logo'] = $row11['image_path'];
									$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
									$response['place_of_supply'] = $row11['place_of_supply'];
									$select_user = mysqli_query($con, "select * from tbl_state_master where state_name='" . $row11['place_of_supply'] . "'");
									if (mysqli_num_rows($select_user) > 0) {
										while ($fetch_user = mysqli_fetch_array($select_user)) {
											$response['party_code'] = $fetch_user['state_code'];
										}
									} else {
										$response['party_code'] = '';
									}
									
									$response['user_phone'] = $row['user_phone'];
									$response['user_email'] = $row['user_email'];
									$response['parent_group'] = $row['parent_group'];
									$response['distributor_category'] = $row11['distributor_category'];
									$response['signature_requirement'] = $row11['signature_requirement'];
									$work_type = $row['work_type'];
									if ($row['e_recharge_setting'] == "Yes") {
										$work_type = $work_type . "+" . "E-Recharge";
									}
									if ($row11['AGRO_type'] == "Yes") {
										$work_type = $work_type . "+" . "AGRO";
									}
									if ($row['saleorder_setting'] == "Yes") {
										$work_type = $work_type . "+" . "SaleOrder_Setting";
									}

									$response['fse_type'] = $work_type;
									$response['success'] = 1;
									$response['details'] = "Data Success";
									$response['isResgister'] = 1;
								} else {
									$response['success'] = 0;
									$response['details'] = "You are already logged in. Please logout from another device or contact distributor!!";
								}
							} else {
								$response['success'] = 0;
								$response['details'] = "OTP Expired";
							}
						} else {
							$response['success'] = 0;
							$response['details'] = "Invalid OTP";
						}
					} else if ($email1 != '') {

						$res = mysqli_query($con, "SELECT * FROM `tbl_party` WHERE party_phone='$email1' limit 1");

						$response = array();

						if (mysqli_num_rows($res) > 0) {

							$row = mysqli_fetch_assoc($res);

							$mobile_no = $row['party_phone'];

							$otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact='$email1' or email='$email1') AND otp = '$otp' AND is_verified = '1'");

							if (mysqli_num_rows($otpCheckSql) > 0) {

								$otpCheckData = mysqli_fetch_assoc($otpCheckSql);
								if ($otpCheckData['otp_status'] == 'VALID') {

									mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE (contact='$email1' or email='$email1')");

									$distributor_id = $row['distributor_id'];

									$select_distributor = mysqli_query($con, "SELECT distributor_category from tbl_distributor where distributor_id='$distributor_id'");

									$fetch_distributor = mysqli_fetch_assoc($select_distributor);

									$que2 = mysqli_query($con, "update tbl_party set imei_no='$mac_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',ip_address='$ip_address',device_id='$device_id' where party_phone='$email1'");

									$response['distributor_work_type'] = $fetch_distributor['distributor_category'];
									$response['party_id'] = $row['party_id'];
									$response['party_name'] = $row['party_name'];
									$response['party_phone'] = $row['party_phone'];
									$response['party_email'] = $row['party_email'];
									$response['gstin_no'] = $row['gstin_no'];
									$response['party_address'] = $row['party_address'];
									$response['pan_it_no'] = $row['pan_it_no'];
									$response['place_of_supply'] = $row['place_of_supply'];
									$response['state_name'] = $row['state_name'];
									$response['party_code'] = $row['party_code'];
									$response['user_type'] = 'Retailer';
									$response['stock_request'] = $row['stock_request'];
									if ($row['party_phone'] == $row['password']) {
										$response['password_change_flag'] = 'Yes';
									} else {
										$response['password_change_flag'] = 'No';
									}


									$dist_detail = mysqli_query($con, "SELECT *,tbl_distributor.distributor_id as distid FROM tbl_distributor,tbl_party where tbl_distributor.distributor_id=tbl_party.distributor_id and tbl_party.party_phone like '%$email1%' group by tbl_distributor.distributor_id");
									$client_list = array();
									if (mysqli_num_rows($dist_detail) > 0) {
										while ($fetch_client = mysqli_fetch_assoc($dist_detail)) {
											$client_list['retailer_id'] = $fetch_client['party_id'];
											$client_list['distributor_id'] = $fetch_client['distid'];
											$client_list['distributor_name'] = $fetch_client['distributor_name'];
											$client_list['phone_no'] = $fetch_client['phone_no'];
											$response['client_list'][] = $client_list;
										}
									} else {
										$response['client_list'] = $client_list;
									}


									$response['success'] = 1;
									$response['details'] = "Data Success";
									$response['isResgister'] = 1;
								} else {
									$response['success'] = 0;
									$response['details'] = "OTP Expired";
								}
							} else {
								$response['success'] = 0;
								$response['details'] = "Invalid OTP";
							}
						} else {

							// $mobile_no = $row['phone_no'];

							$otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact='$email1' or email='$email1') AND otp = '$otp' AND is_verified = '1'");

							if (mysqli_num_rows($otpCheckSql) > 0) {

								$otpCheckData = mysqli_fetch_assoc($otpCheckSql);
								if ($otpCheckData['otp_status'] == 'VALID') {

									mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE contact = '$mobile_no'");
								}
								$response['success'] = 1;
								$response['details'] = "OTP Verified Successfully";
								$response['isResgister'] = 0;
							} else {
								$response['success'] = 0;
								$response['details'] = "Invalid OTP!";
								$response['isResgister'] = 0;
							}
						}
					} else {

						$otpCheckSql = mysqli_query($con, "SELECT *,CASE WHEN TIMESTAMPDIFF(MINUTE, inserted_at, NOW()) >= 10 THEN 'EXPIRED' ELSE 'VALID' END AS otp_status FROM `tbl_otp_history` WHERE (contact='$email1' or email='$email1') AND otp = '$otp' AND is_verified = '1'");

						if (mysqli_num_rows($otpCheckSql) > 0) {

							$otpCheckData = mysqli_fetch_assoc($otpCheckSql);
							if ($otpCheckData['otp_status'] == 'VALID') {

								mysqli_query($con, "UPDATE `tbl_otp_history` SET is_verified = '2' WHERE contact = '$mobile_no'");
							}
							$response['success'] = 1;
							$response['details'] = "OTP Verified Successfully";
							$response['isResgister'] = 0;
						} else {
							$response['success'] = 0;
							$response['details'] = "Invalid OTP";
							$response['isResgister'] = 0;
						}
					}
				}
			}
		}
	
} else if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'loginQr') {

	$encryptedToken = $post['token'];
	$version_code = isset($post['version_code']) ? $post['version_code'] : '';
	$token = base64_decode($encryptedToken);
	$mac_id = $post['imei_no'];
	$device_id = $post['device_id'];
	$ip_address = $post['ip_address'];
	$carrier_name = $post['carrier_name'];
	$app_version = $post['app_version'];
	$phone_model = $post['phone_model'];
	$phone_manufacturer = $post['phone_manufacturer'];
	$sdk_phone_version = $post['sdk_phone_version'];
	$current_date_time = date('Y-m-d H:i:s');
	$checkQrToken = mysqli_query($con, "SELECT * FROM `tbl_distributor_users` WHERE login_token_id = '$token' AND user_role='All' AND app_login='Yes' AND status = 'Active'");
	if (mysqli_num_rows($checkQrToken) != 0) 
	{
			$fetchUserId = mysqli_fetch_assoc($checkQrToken);
			$token_time = $fetchUserId['token_generate_time'];
			$token_time_ts = strtotime($token_time);
			$current_ts    = strtotime($current_date_time);
			$diff = $current_ts - $token_time_ts;
			if ($diff > 60) {
				$response['success'] = 0;
				$response['details'] = "Token is expired, generate again";
			} else 
			{
				$client_id = $fetchUserId['distributor_id'];
				$dis_id = $fetchUserId['distributor_user_id'];
				$clearToken = mysqli_query($con, "UPDATE `tbl_distributor_users` SET token_generate_time = '0000-00-00 00:00:00', login_token_id = '',imei_no='$mac_id',ip_address='$ip_address',carrier_name='$carrier_name',device_id='$device_id',app_version='$app_version',phone_model='$phone_model',phone_manufacturer='$phone_manufacturer',sdk_phone_version='$sdk_phone_version',version_code='$version_code' WHERE distributor_id = '$client_id' and distributor_user_id='$dis_id'");

				$response['user_id'] = $fetchUserId['distributor_user_id'];
				$response['user_type'] = 'Admin';

				$query_message = mysqli_query($con, "INSERT INTO `tbl_distributor_users_login`(`distributor_user_id`, `distributor_id`, `distributor_name`, `password`, `phone_no`, `imei_no`, `ip_address`, `app_version`, `version_code`) VALUES ('$dis_id','" . $fetchUserId['distributor_id'] . "','" . $fetchUserId['distributor_name'] . "','" . $fetchUserId['password'] . "','" . $fetchUserId['phone_no'] . "','" . $fetchUserId['imei_no'] . "','" . $fetchUserId['ip_address'] . "','" . $fetchUserId['app_version'] . "','" . $fetchUserId['version_code'] . "')");


				$response['distributor_id'] = $fetchUserId['distributor_id'];
				$response['distributor_name'] = $fetchUserId['distributor_name'];
				$response['distributor_email'] = $fetchUserId['distributor_email'];
				$response['distributor_address'] = $fetchUserId['distributor_address'];
				$response['distributor_phone'] = $fetchUserId['phone_no'];

				$dis_id = $fetchUserId['distributor_id'];
				$res_dis = mysqli_query($con, "Select * from tbl_distributor where distributor_id='$dis_id'");
				$row11 = mysqli_fetch_assoc($res_dis);
				
				$response['state_code'] = $row11['state_code'];
				$response['job_work'] = $row11['job_work'];
				$response['doctorapp_type'] = $row11['doctorapp_type'];
				$response['place_of_supply'] = $row11['place_of_supply'];
				$response['milkman_type'] = $row11['milkman_type'];
				$response['stone_crusher'] = $row11['stone_crusher'];
				$response['jobwork_gst_configure'] = $row11['jobwork_gst_configure'];
				$response['distributor_category'] = $row11['distributor_category'];
				$response['distributor_logo'] = $row11['image_path'];
				$response['success'] = 1;
				$response['details'] = "User Details";
				$response['isResgister'] = 1;
			}
		} else {
			$response['success'] = 0;
			$response['details'] = "Invalid token";
		}
	
} else {
	$response['success'] = 0;
	$response['details'] = "Required fields missing";
}
echo json_encode($response);
