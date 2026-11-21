<?php
ob_start();
error_reporting(0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

include('../../vendor/autoload.php');
date_default_timezone_set('Asia/Calcutta');
$cdate = date("Y-m-d");
$ctime = date("H:i:s");
$response = array();
include("../../connect.php");
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'clientRegistration') {

	$response = array();
	$contact = $_POST['contact'];
	// $contact=$_POST['otp'];
	// $otp_code = $_POST['otp'];
	$email = $_POST['email'];
	$country_name = $_POST['country'];
	// $otp_code =  mt_rand(100000,999999);
	// if($country_name=='India'){
	// 	$curl = curl_init();
	// 	curl_setopt_array($curl, [
	// 		CURLOPT_URL => "https://api.msg91.com/api/v5/otp/verify?otp=".$otp_code."&authkey=387502ATd2tyowCg63abef8dP1&mobile=91".$contact,
	// 		CURLOPT_RETURNTRANSFER => true,
	// 		CURLOPT_ENCODING => "",
	// 		CURLOPT_MAXREDIRS => 10,
	// 		CURLOPT_TIMEOUT => 30,
	// 		CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	// 		CURLOPT_CUSTOMREQUEST => "GET",
	// 	]);
	// 	$response_get = curl_exec($curl);
	// 	$err = curl_error($curl);
	// 	curl_close($curl);
	// 	$result=json_decode($response_get);
	//           	// echo $result->type;
	// 	$fin_Res=$result->type;
	// 	$request_id=$result->message;
	// 	// if($fin_Res=='success'){
	// 	// 	$result=1;
	// 	// }else{
	// 	// 	$result=$request_id;
	// 	// }
	// 	$fin_Res=$result->type;
	// 	$request_id=$result->message;
	// 	// echo $result->type;
	// 	// echo $result->message;
	// 	if($fin_Res=='success'){
	// 		$result=1;
	// 		$response["success"]='1';
	// 		$response["detail"]='OTP has been successfully verfied!';
	// 	}else{
	// 		$result=0;
	// 		$response["success"]='0';
	// 		$response["detail"]='You have entered the wrong OTP!';
	// 	}
	// 	$bNm=urldecode($_POST['name']);
	// 	$place_supply=$_POST['place_supply'];
	// 	$email=$_POST['email'];
	// 	$contact=$_POST['contact'];
	// 	$bLogo = isset($_FILES['logo']['name']) ? $_FILES['logo']['name'] : '';
	// 	$business_type = isset($_POST['business_type']) ? $_POST['business_type'] : 'Service';
	// 	$services_type = isset($_POST['services_type']) ? $_POST['services_type'] : '';
	// 	$login_type = isset($_POST['login_type']) ? $_POST['login_type'] : 'BTHAWK';
	// 	$login_lat = isset($_POST['login_lat']) ? $_POST['login_lat'] : '';
	// 	$login_long = isset($_POST['login_long']) ? $_POST['login_long'] : '';
	// 	$login_address = isset($_POST['login_address']) ? $_POST['login_address'] : '';
	// 	$login_contact = isset($_POST['login_contact']) ? $_POST['login_contact'] : '';
	// 	$login_operator = isset($_POST['login_operator']) ? $_POST['login_operator'] : '';
	// 	// echo $otp_code." ".$contact." ".$country." ".$email." ".$bnm." ".$place_supply." ".$blogo." ".$business_type." ".$services_type;
	// }else{
	// 	$res_search = mysqli_query($con,"select * from tbl_otp_history where contact='$contact' and country='$country_name' and otp='$otp_code'");
	// 	$row_search  = mysqli_num_rows($res_search);
	// 	if($row_search==1)
	// 	{
	// 		$result=1;
	// 		// $response["success"]='1';
	// 		// $response["detail"]='OTP has been successfully verfied!';
	// 	}else{
	// 		$result=0;
	// 		// $response["success"]='0';
	// 		// $response["detail"]='You have entered the wrong OTP!';
	// 	}
	// }
	$result = 1;
	if ($result == 1) {
		if ((!empty($_POST["name"])) && (!empty($_POST["contact"])) && (!empty($_POST["email"])) && (isset($_POST["gst"]))) {
			$contact = $post['contact'];
			$email = $post['email'];
			$country_name = $post['country'];

			$bNm = urldecode($post['name']);
			$place_supply = $post['place_supply'];
			$bLogo = isset($_FILES['logo']['name']) ? $_FILES['logo']['name'] : '';
			$business_type = isset($post['business_type']) ? $post['business_type'] : 'Service';
			$services_type = isset($post['services_type']) ? $post['services_type'] : '';
			$login_type = isset($post['login_type']) ? $post['login_type'] : 'BTHAWK';

			$login_lat = isset($post['login_lat']) ? $post['login_lat'] : '';
			$login_long = isset($post['login_long']) ? $post['login_long'] : '';
			$login_address = isset($post['login_address']) ? $post['login_address'] : '';
			$login_contact = isset($post['login_contact']) ? $post['login_contact'] : '';
			$login_operator = isset($post['login_operator']) ? $post['login_operator'] : '';

			$ip_address = isset($post['ip_address']) ? $post['ip_address'] : '';
			$imei_no = isset($post['imei_no']) ? $post['imei_no'] : '';
			$device_id = isset($post['device_id']) ? $post['device_id'] : '';
			$app_version = isset($post['app_version']) ? $post['app_version'] : '';
			$phone_model = isset($post['phone_model']) ? $post['phone_model'] : '';
			$phone_manufacturer = isset($post['phone_manufacturer']) ? $post['phone_manufacturer'] : '';
			$sdk_phone_version = isset($post['sdk_phone_version']) ? $post['sdk_phone_version'] : '';
			$version_code = isset($post['version_code']) ? $post['version_code'] : '';

			if ($bLogo != "") {
				$temp1 = $_FILES['logo']['tmp_name'];
				$destination = "../distributor_logo/" . $bLogo;
				if (!move_uploaded_file($temp1, $destination)) {
					error_log("File upload failed for: $bLogo");
				}
			} else {
				$bLogo = "";
			}
			$app_login_val = 'Yes';
			$user_role_val = 'All';
			if ($login_type == "Scanner") {
				$app_login_val = 'No';
				$user_role_val = 'View';
			}
			//$bLogo1=$_POST["tmpname"];
			$gst = $_POST['gst'];
			date_default_timezone_set("Asia/Kolkata");
			$regdate = date("Y-m-d H:i:s");
			$regdate_date = date("Y-m-d");
			$regdate_time = date("H:i:s");
			$r_date = strtotime($regdate_date);
			$r2_date = strtotime("+7 day", $r_date);
			$next_renew_date = trim(date('Y-m-d', $r2_date));
			//$arr=explode(" ",$bNm);
			$pass = strtolower("bthawk@4321");
			$terms_id1 = "Goods once sold will not be taken back.";
			$terms_id2 = "Interest @ 18% p.a. will be charged if the payment for " . $bNm . " is not made with in the stipulated time.";
			$terms_id3 = "INR 300 will be charged in case of cheque return.";
			if ($services_type == 'Stone Crusher')
				$stoneval = 'Yes';
			else
				$stoneval = 'No';
			$res_check = mysqli_query($con, "Select gstin_no from tbl_distributor where distributor_email='$email' or phone_no='$contact'");
			if (mysqli_num_rows($res_check) <= 0) {
				$res_check1 = mysqli_query($con, "Select gstin_no from tbl_distributor where gstin_no='$gst' limit 1");
				$fetch_gst_val = mysqli_fetch_assoc($res_check1);
				if ($fetch_gst_val['gstin_no'] == '' || $fetch_gst_val['gstin_no'] != $gst) {
					$select_state = mysqli_query($con, "SELECT state_code FROM tbl_state_master WHERE state_name='$place_supply'");
					$fetch_state = mysqli_fetch_assoc($select_state);
					$state_code = $fetch_state['state_code'];
					$qry = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor(distributor_name,distributor_email,phone_no,image_path,gstin_no, status,registration_datetime, next_renew_date, place_of_supply,state_code,distributor_category, distributor_services,source, distributor_gst_configure,stone_crusher,plan_id, compliance_status, balance_sheet_config,bthawk_sale_purchase,login_lat,login_long,login_address,login_contact, login_operator, plan_name, plan_type,sale_allowed,country)values('$bNm','$email','$contact','$bLogo','$gst','Active','$regdate','$next_renew_date','$place_supply','$state_code','$business_type','$services_type','App','Inclusive','$stoneval','1', 'Inactive - Not Responding','Yes','No','$login_lat','$login_long','$login_address','$login_contact','$login_operator','10','Rental','Yes','$country_name')");
					$res = mysqli_query($con, "Select distributor_id from tbl_distributor order by distributor_id desc limit 1");
					while ($row = mysqli_fetch_assoc($res)) {
						$temp_id = $row['distributor_id'];
						$code = 'BTCASH';
						$query_pparty = mysqli_query($con, "INSERT INTO `tbl_purchase_party`(`bt_party_id`, `party_name`, `party_address`, `insert_datetime`, `distributor_id`, `place_of_supply`, `state_code`) VALUES ('$code','Cash','$place_supply','$regdate_date','$temp_id','$place_supply','$state_code')");
						$zucol = mysqli_query($con, "INSERT INTO tbl_party (party_name,party_type,distributor_id,group_name,party_address,place_of_supply,state_name, tb_insertdatetime, tb_inserttime,status,party_code) VALUES ('Cash','Retailer','$temp_id','Sundry Debtors','$place_supply','$place_supply','$place_supply','$regdate_date','$regdate_time','Active','$state_code')");
						$party_id = mysqli_insert_id($con);
						$qry_user = mysqli_query($con, "INSERT INTO `tbl_user`(`distributor_id`, `user_name`, `user_phone`, `user_password`, `user_type`, `invoice_type`, `e_recharge_setting`, `work_type`, `parent_group`, `tb_insertdatetime`, `next_renew_date`, `status`) VALUES ('$temp_id','FOS1','$contact','$contact','2','Both','No','$business_type','main store','$regdate','$next_renew_date','Active')");
						$temp_1 = mysqli_insert_id($con);
						$query11 = mysqli_query($con, "INSERT IGNORE INTO tbl_party_user (party_id, user_id, insert_date) VALUES ('$party_id', '$temp_1', '$regdate_date')");
						$qry11 = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_users(distributor_id,distributor_name, distributor_email, password,phone_no, image_path, gstin_no,status,registration_datetime,user_role, app_login) values('$temp_id','$bNm','$email','$pass','$contact','$bLogo','$gst', 'Active','$regdate','$user_role_val','$app_login_val')");
						$distributor_user_id = mysqli_insert_id($con);
						$qry_insert = mysqli_query($con, "INSERT INTO `tbl_dist_terms_conditions`(`distributor_id`, `terms_condition1`, `terms_condition2`, `terms_condition3`,`insert_datetime`) VALUES ('$temp_id','$terms_id1','$terms_id2','$terms_id3','$regdate')");
						$select_circle = mysqli_query($con, "SELECT commission_rate FROM tbl_purchase_commission_master where circle_name like '%$place_supply%'");
						if (mysqli_num_rows($select_circle) > 0) {
							while ($fetch_circle = mysqli_fetch_array($select_circle)) {
								$circle_commission_rate = $fetch_circle['commission_rate'];
								$qry_operator = mysqli_query($con, "INSERT INTO `tbl_distributor_operator_master`(`distributor_id`, `circle_id`, `operator_id`, `commission_rate`, `sender_id`) VALUES ('$temp_id','1','1','$circle_commission_rate','Airtel')");
							}
						} else {
							$qry_operator = mysqli_query($con, "INSERT INTO `tbl_distributor_operator_master`(`distributor_id`, `circle_id`, `operator_id`, `commission_rate`, `sender_id`) VALUES ('$temp_id','1','1','0.04474','Airtel')");
						}
						$qry_service = mysqli_query($con, "INSERT INTO `tbl_client_service`(`distributor_id`, `self_bthawk`, `auto_bthawk`, `itr`, `gst`, `audit`, `gst_registration`, `dsc_token`, `it_notice`, `udyog_aadhar`, `P2P`,`status`,`insert_datetime`)VALUES('$temp_id', 'Yes','No','No','No','No','No','No','No','No','No','Active','$regdate')");
						$query = mysqli_query($con, "INSERT INTO `tbl_product_category_master`(`distributor_id`, `category_name`, `status`, `insert_date`, `insert_time`) VALUES ('$temp_id','Service','Active','$regdate_date','$regdate_time')");
						$service_cat = mysqli_insert_id($con);
						$query1 = mysqli_query($con, "INSERT INTO `tbl_product_subcategory_master`( `category_id`, `subcategory_name`, `status`, `insert_date`, `insert_time`) VALUES ('$service_cat','Service','Active','$regdate_date','$regdate_time')");
						$service_subcat = mysqli_insert_id($con);
						if (strpos($business_type, 'Service') !== false) {
							$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,product_category,unit,maintain_inventory) VALUES ('$temp_id','LAPU PREPAID','1','1','9','9','18','Active','$regdate','Service','$service_cat','$service_subcat','LAPU BALANCE','Pcs','No')");
						}
						if (strpos($business_type, 'FMCG') !== false) {
							$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,unit,maintain_inventory) VALUES ('$temp_id','Bikaji Bikaneri Bhujia 1kg','100','100','9','9','18','Active','$regdate','FMCG','$service_cat','$service_subcat','Pcs','No')");
						}
						if (strpos($business_type, 'Serial No') !== false) {
							$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,unit,maintain_inventory) VALUES ('$temp_id','Mobile Phone','100','100','9','9','18','Active','$regdate','Serial No','$service_cat','$service_subcat','Pcs','No')");
						}
						// new code

						$dis_id = $temp_id;
						$res_dis = mysqli_query($con, "SELECT * from `tbl_distributor` where distributor_id='$dis_id'");
						$row11 = mysqli_fetch_assoc($res_dis);

						$returnArr[] = [
							'distributor_id' => $row11['distributor_id'],
							'distributor_user_id' => $distributor_user_id,
							'distributor_name' => $row11['distributor_name'],
							'distributor_email' => $row11['distributor_email'],
							'distributor_address' => $row11['distributor_address'],
							'distributor_phone' => $row11['phone_no'],
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
						];
						// new code
					}
				}
			}
			if ($qry) {
				$client_id = $temp_id;
				$arrayToSend = [
					"countryCode" => '+91',
					"phoneNumber" => $contact,
					"callbackData" => "Message Send",
					"type" => "Template",
					"template" => [
						"bodyValues" => [
							$bNm,
							$email,
							$pass,
							$contact
						]
					]
				];
				$url = "https://api.interakt.ai/v1/public/message/";
				$apiKey = "Basic aWlMOEFiVHFFcmpWWG8wQUlHbkZzUUtINm5lc2p3djVzbkVfTVRqa0xTNDo=";
				$message_for = "Login Credential";
				$templateName = "credential";
				$languageCode = "en";
				$arrayToSend['template']['name'] = $templateName;
				$arrayToSend['template']['languageCode'] = $languageCode;
				$json = json_encode($arrayToSend);
				$headers = array();
				$headers[] = 'Content-Type: application/json';
				$headers[] = 'Authorization: ' . $apiKey;
				$ch = curl_init();
				curl_setopt($ch, CURLOPT_URL, $url);
				curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
				curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
				curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
				//Send the request
				// echo $response = curl_exec($ch);
				$interaktResponse = curl_exec($ch);
				// echo $interaktResponse;
				// echo "<br>";
				// $resultRes = json_decode($response);
				$resultRes = json_decode($interaktResponse);
				if ($resultRes->result) {
					$message_id = $resultRes->id;
					$status = $resultRes->result;
					$retData = array('success' => true, 'details' => 'Whatsapp Msg send successfully !!');
					$insertSql = mysqli_query($con, "INSERT INTO `tbl_btcw_whatsapp_api_response`(`client_id`, `message_id`, `message_for`, `unique_id`, `status`) VALUES ('$client_id','$message_id','$message_for','Login Credentails Share','$status')");
				} else {
					$retData = array('success' => false, 'details' => $resultRes->message);
				}
				curl_close($ch);

				$user_mail_body = "<table style='width:75%; border:2px #d6d6d6 solid;' align='center'>
				<tr><td colspan='6' align='center' bgcolor='#d9e6f7'><img src='https://www.bthawk.appexperts.net/img/BTHAWK.png' width='100px' height='100px'></td> </tr>
				<tr><td colspan='6' style='padding:5px;'>Namaskar !!<br><br><b style='font-size:17px;'>Congratulations on signing up for BTHAWK!</b><br><br style='font-size:14px;'>Thanks for joining BTHAWK - One Stop Distribution Channel Solution. We're excited to share everything that will help you to know how of BTHAWK, and growing your business.<br><br></td> </tr>
				<tr>
				<td>&nbsp;</td><td>&nbsp;</td>
				<td align='right'><img src='https://www.bthawk.appexperts.net/img/circle.png' style='display:block;' width='100'></td><td style='padding:10px;' colspan='3'>	
				<b style='font-size:14px;'>Login into Distributor Dashboard</b><br><br>Dashboard Link:&nbsp;&nbsp;&nbsp;&nbsp;https://bthawk.appexperts.net<br>
				Firm Name:&nbsp;&nbsp;&nbsp;&nbsp;$bNm<br>
				User Email:&nbsp;&nbsp;&nbsp;&nbsp;$email<br>
				Password:&nbsp;&nbsp;&nbsp;&nbsp;$pass<br>
				Distributor Contact No:&nbsp;&nbsp;&nbsp;&nbsp;$contact<br>
				GSTIN NO:&nbsp;&nbsp;&nbsp;&nbsp;$gst<br>
				Place of Supply:&nbsp;&nbsp;$place_supply<br>
				<br>
				<a style='background:#00BCD4;text-align:center;width:120px;color:#ffffff;font-size:17px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;display:block;text-decoration:none' href='https://www.bthawk.appexperts.net/' target='_blank'>Login</a></td></tr>
				<tr><th align='right'><img src='https://www.bthawk.appexperts.net/img/SY.png' width='60px' style='margin-left:6px;'></th>
				<th align='left' colspan='5' style='padding:5px;'>Priyanka<br>Manager Sales<br>sales@belltechnology.in | +91-7340040171</th></tr>
				<tr><td colspan='6'><hr></td></tr>
				<tr>
				<td td colspan='6' style='padding:5px;'>
				<b>Share below required details by Just replying to this email and we will get back to you!</b><br></td>
				</tr>
				<tr>
				<td align='right'><img src='https://www.bthawk.appexperts.net/img/document.png' style='display:block;' width='80'></td><td style='padding:10px;' width='25%'>	
				<b style='font-size:12px;'>FOS/DSE Details</b><br><br>(FOS Number, FOS Name)</td>
				<td align='right'><img src='https://www.bthawk.appexperts.net/img/document.png' style='display:block;' width='80'></td><td style='padding:10px;' width='25%'>	
				<b style='font-size:12px;'>Party/Retailer Details</b><br><br>(Mapped FOS Number, Party MDN, Party Name)</td>
				<td align='right'><img src='https://www.bthawk.appexperts.net/img/document.png' style='display:block;' width='80'></td><td style='padding:10px;' width='25%'>	
				<b style='font-size:12px;'>Your Product Details</b><br><br>(Product Name, Product Purchase Price, Product Sale Price, HSN Code)<br></td></tr>
				<tr><td colspan='6'><hr></td></tr>
				<tr>
				<td td colspan='6' style='padding:5px;'><b style='font-size:14px;'>Download Sales Executive(FOS / DSE) App</b><br><br> <a href='https://play.google.com/store/apps/details?id=belltechnology.in.bthawkadmin'><img alt='Get it on Google Play' src='https://play.google.com/store/apps/details?id=belltechnology.in.bthawkadmin' width='150px' height='50px'/></a>.</td>
				</tr>
				</table><br><br><hr>
				Disclaimer:This E-Mail may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, Kindly notify the sender and then delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be unlawful.
				Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or contain viruses. BTHAWK does not accept any liability for any errors, omissions, viruses or computer problems experienced by any recipient as a result of this e-mail.";

				$mail = new PHPMailer(true);
				$mail->isSMTP();
				//Set SMTP host name                          
				$mail->Host = "smtp.zeptomail.in";
				//Set this to true if SMTP host requires authentication to send email
				$mail->SMTPAuth = true;
				//Provide username and password     
				$mail->Username = "emailappsmtp.37a9e995e8ab3fca";
				$mail->Password = "EVuKC4LqFaQE";
				$mail->SetFrom("noreply@appexperts.net");
				//If SMTP requires TLS encryption then set it
				$mail->SMTPSecure = "tls";
				//Set TCP port to connect to 
				$mail->Port = 587;
				//From email address and name
				$mail->CharSet = 'UTF-8';
				//To address and name
				$mail->addAddress($email);
				$mail->addCC("prince.pal@bthawk.com", "Priyanka");
				//$mail->addAddress("shilpa@bthawk.com");
				$mail->isHTML(true);
				$mail->Subject = "BTHAWK APP for " . $bNm;
				$mail->Body = "<i>$user_mail_body</i>";
				if ($mail->send()) {
					echo json_encode(['status' => 1, 'data' => $returnArr, 'message' => 'Successfully Registered']);
					exit();
				} else {
					echo json_encode(['status' => 2, 'data' => $returnArr, 'message' => 'Successfully Registered']);
					exit();
				}
			} else {
				echo json_encode(['status' => 0, 'data' => null, 'message' => 'Registration Error or already registered distributor!']);
				exit();
			}
		} else {
			echo json_encode(['status' => 0, 'data' => null, 'message' => $gst . $contact . $name]);
			exit();
		}
	} else {
		echo json_encode(['status' => 0, 'data' => null, 'message' => 'Field missing' . $contact . " " . $country_name]);
		exit();
	}
} else {
	echo json_encode(['status' => 0, 'data' => null, 'message' => 'Required field missing']);
	exit();
}
