<?php
ob_start();
error_reporting(0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

include('../../../vendor/autoload.php');
date_default_timezone_set('Asia/Calcutta');
$cdate = date("Y-m-d");
$ctime = date("H:i:s");
$response = array();
include("../../../connect.php");
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
// print

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'clientRegistration') {

	$response = array();
	$contact = $post['contact'];
	$email = $post['email'];
	$country_name = $post['country'];

	$result = 1;
	if ($result == 1) {
		if ((!empty($post["name"])) && (!empty($post["contact"])) && (!empty($post["email"])) && (isset($post["gst"]))) {
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
			$gst = $post['gst'];
			date_default_timezone_set("Asia/Kolkata");
			$regdate = date("Y-m-d H:i:s");
			$regdate_date = date("Y-m-d");
			$regdate_time = date("H:i:s");
			$r_date = strtotime($regdate_date);
			$r2_date = strtotime("+30 day", $r_date);
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
						$zucol = mysqli_query($con, "INSERT INTO tbl_party (party_name,party_type,distributor_id,group_name,party_address,place_of_supply,state_name, tb_insertdatetime, tb_inserttime,status,party_code,country,currancy) VALUES ('Cash','Retailer','$temp_id','Sundry Debtors','$place_supply','$place_supply','$place_supply','$regdate_date','$regdate_time','Active','$state_code','India','INR')");
						$party_id = mysqli_insert_id($con);
						$qry_user = mysqli_query($con, "INSERT INTO `tbl_user`(`distributor_id`, `user_name`, `user_phone`, `user_password`, `user_type`, `invoice_type`, `e_recharge_setting`, `work_type`, `parent_group`, `tb_insertdatetime`, `next_renew_date`, `status`) VALUES ('$temp_id','FOS1','$contact','$contact','2','Both','No','$business_type','main store','$regdate','$next_renew_date','Active')");
						$temp_1 = mysqli_insert_id($con);
						$query11 = mysqli_query($con, "INSERT IGNORE INTO tbl_party_user (party_id, user_id, insert_date) VALUES ('$party_id', '$temp_1', '$regdate_date')");
						$qry11 = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_users(distributor_id,distributor_name, distributor_email, password,phone_no, image_path, gstin_no,status,registration_datetime,user_role, imei_no,app_login) values('$temp_id','$bNm','$email','$pass','$contact','$bLogo','$gst', 'Active','$regdate','$user_role_val','$imei_no','$app_login_val')");
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

				$user_mail_body = '<center role="article" aria-roledescription="email" lang="en" style="width:100%; background-color:#f5f7fb;">
		<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f7fb;">
		<tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(16,24,40,0.06);">

            <!-- Header / Logo -->
            <tr>
              <td class="logo p-24" style="padding:28px 28px 0 28px; text-align:center;">
                <a href="https://bthawk.com" target="_blank" rel="noopener">
                  <img src="https://bthawk.appexperts.net/assets/new_bthawk_logo_new.png" width="200" alt="BTHAWK+" style="display:block; border:0; outline:none; text-decoration:none; margin:0 auto; max-width:200px; height:auto;">
                </a>
              </td>
            </tr>

            <!-- Hero / Title -->
            <tr>
              <td class="p-24" style="padding:8px 28px 0 28px;">
                <h1 style="margin:0; font-family: Inter, Arial, sans-serif; font-size:24px; line-height:32px; color:#101828; font-weight:700; text-align:center;">Welcome to BTHAWK+ — Faster Billing, Smarter Stock & Effortless E-Invoicing</h1>
                <p style="margin:12px 0 0 0; font-family: Inter, Arial, sans-serif; font-size:15px; line-height:24px; color:#475467; text-align:left;"><b>Namaskar ' . htmlspecialchars($bNm) . ',</b> <br> Thank you for trusting <b>BTHAWK+</b> to handle your business accounting and operations. We’re excited to have you on board. Below are your login details and next steps to get started quickly.</p>
              </td>
            </tr>

            <!-- Feature list -->
            <tr>
              <td class="p-24" style="padding:20px 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td class="stack" width="33.33%" style="vertical-align:top; padding:8px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb; border:1px solid #eaecf0; border-radius:10px;">
                        <tr><td style="padding:16px; font-family: Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#344054;">
                          <strong>GST Billing & E-Invoicing</strong><br> Create invoices in seconds and generate IRNs instantly.
                        </td></tr>
                      </table>
                    </td>
                    <td class="stack" width="33.33%" style="vertical-align:top; padding:8px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb; border:1px solid #eaecf0; border-radius:10px;">
                        <tr><td style="padding:16px; font-family: Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#344054;">
                          <strong>Live Stock Tracking</strong><br> Get accurate inventory, low-stock alerts, and batch/expiry.
                        </td></tr>
                      </table>
                    </td>
                    <td class="stack" width="33.33%" style="vertical-align:top; padding:8px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb; border:1px solid #eaecf0; border-radius:10px;">
                        <tr><td style="padding:16px; font-family: Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#344054;">
                          <strong>Deep Reporting</strong><br> Clear insights on sales, purchases, GST, and profitability.
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
			
			<tr>
				<td class="p-24" style="padding:0 28px 8px 28px;">
				<center>
					<a href="https://play.google.com/store/search?q=BTHAWK&c=apps" target="_blank">
					  <img src="https://bthawk.appexperts.net/assets/bthawkAppDownload.jpg" width="450">
					</a>
				</center>
				</td>
			</tr>

            <!-- Account Help -->
            <tr>
              <td class="p-24" style="padding:0 28px 8px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fcfcfd; border:1px solid #f2f4f7; border-radius:10px;">
                  <tr>
                    <td style="padding:16px; font-family:Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#475467;">
                      <strong>How to log in</strong><br>
                      Use your <strong>registered mobile number</strong> (OTP) or <strong>email ID & password</strong> to access your account. <br>
						User Email:&nbsp;&nbsp;&nbsp;&nbsp;'.$email.'<br>
						Password:&nbsp;&nbsp;&nbsp;&nbsp;'.$pass.'<br>
						Contact No:&nbsp;&nbsp;&nbsp;&nbsp;'.$contact.'<br>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td align="center" style="padding:8px 28px 24px 28px;">
                <a href="https://bthawk.appexperts.net/" target="_blank" rel="noopener" style="background:#5B67F1; border-radius:8px; display:inline-block; font-family:Inter, Arial, sans-serif; font-size:16px; font-weight:700; line-height:44px; text-align:center; text-decoration:none; width:260px; color:#ffffff;padding:5px;"> Log in to BTHAWK+ </a>
                <p style="margin:12px 0 0 0; font-family:Inter, Arial, sans-serif; font-size:12px; line-height:18px; color:#667085;">Or paste this into your browser: <span style="word-break:break-all;">https://bthawk.appexperts.net/</span></p>
              </td>
            </tr>

            <!-- App badges -->
            <tr>
              <td class="p-24" style="padding:0 28px 8px 28px; text-align:center;">
                <p style="margin:0 0 8px 0; font-family:Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#475467;">Prefer mobile? Get the BTHAWK+ app</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td style="padding:8px;">
                      <a href="https://play.google.com/store/apps/details?id=com.bthawk" target="_blank" rel="noopener"><img src="https://bthawk.appexperts.net/assets/googleplaystore.png" width="140" alt="Get it on Google Play" style="border:0; display:block; height:auto;"></a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Support / Contact -->
            <tr>
              <td class="p-24" style="padding:8px 28px 20px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fcfcfd; border:1px solid #f2f4f7; border-radius:10px;">
                  <tr>
                    <td style="padding:16px; font-family:Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#475467;">
                      Need help? Write to <a href="mailto:sales@bthawk.com" style="color:#5B67F1; text-decoration:none;">sales@bthawk.com</a> · Call <a href="tel:+917627071256" style="color:#5B67F1; text-decoration:none;">+91‑7627071256</a> / <a href="tel:+917340400171" style="color:#5B67F1; text-decoration:none;">7340400171</a> · Visit <a href="https://bthawk.com" target="_blank" rel="noopener" style="color:#5B67F1; text-decoration:none;">bthawk.com</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 28px 32px 28px; text-align:center;">
                <p style="margin:0 0 8px 0; font-family:Inter, Arial, sans-serif; font-size:12px; line-height:18px; color:#98a2b3;">© 2025 BTHAWK+ · <a href="https://bthawk.com" target="_blank" rel="noopener" style="color:#98a2b3; text-decoration:underline;">bthawk.com</a></p>
                <p style="margin:0; font-family:Inter, Arial, sans-serif; font-size:12px; line-height:18px; color:#98a2b3;">ZUCOL Solutions Pvt. Ltd., India · <a href="#unsubscribe" target="_blank" rel="noopener" style="color:#98a2b3; text-decoration:underline;">Unsubscribe</a> · <a href="#viewbrowser" target="_blank" rel="noopener" style="color:#98a2b3; text-decoration:underline;">View in browser</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0; font-family: Arial, sans-serif; font-size:12px; line-height:18px; color:#98a2b3; text-align:center;">Disclaimer:This E-Mail may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, Kindly notify the sender and then delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be unlawful. 

			Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or contain viruses. BTHAWK+ does not accept any liability for any errors, omissions, viruses or computer problems experienced by any recipient as a result of this e-mail.</p>
        </td>
      </tr>
    </table>
  </center>';

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
				//$mail->addCC("prince.pal@bthawk.com", "Prince");
				$mail->addAddress("techsupport@bthawk.com");
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
				$checkUser = mysqli_query($con, "SELECT * FROM `tbl_distributor` WHERE distributor_email = '$email' OR phone_no = '$contact'");
				if (mysqli_num_rows($checkUser) != 0) {
					$fetchUser = mysqli_fetch_assoc($checkUser);

					$checkUserStatus = 0;

					$fetchUser = mysqli_fetch_assoc($checkUser);

					$status = $fetchUser['status'] ?? '';
					$distributor_id = $fetchUser['distributor_id'] ?? null;

					switch ($status) {
						case 'Active':
							$checkUserStatus = 1;
							break;
						case 'Onboard pending':
							$checkUserStatus = 2;
							break;
						case 'Deleted':
						case 'Discontinue':
							$checkUserStatus = 3;
							break;
					}

					if ($checkUserStatus == 1) {
						echo json_encode(['status' => 0, 'data' => null, 'message' => 'Already Registered']);
						exit();
					} else if ($checkUserStatus == 2) {
						$res_check1 = mysqli_query($con, "SELECT gstin_no from tbl_distributor where gstin_no='$gst' limit 1");
						$fetch_gst_val = mysqli_fetch_assoc($res_check1);
						if ($fetch_gst_val['gstin_no'] == '' || $fetch_gst_val['gstin_no'] != $gst) {
							$select_state = mysqli_query($con, "SELECT state_code FROM tbl_state_master WHERE state_name='$place_supply'");
							$fetch_state = mysqli_fetch_assoc($select_state);
							$state_code = $fetch_state['state_code'];
							// $qry = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor(distributor_name,distributor_email,phone_no,image_path,gstin_no, status,registration_datetime, next_renew_date, place_of_supply,state_code,distributor_category, distributor_services,source, distributor_gst_configure,stone_crusher,plan_id, compliance_status, balance_sheet_config,bthawk_sale_purchase,login_lat,login_long,login_address,login_contact, login_operator, plan_name, plan_type,sale_allowed,country)values('$bNm','$email','$contact','$bLogo','$gst','Active','$regdate','$next_renew_date','$place_supply','$state_code','$business_type','$services_type','App','Inclusive','$stoneval','1', 'Inactive - Not Responding','Yes','No','$login_lat','$login_long','$login_address','$login_contact','$login_operator','10','Rental','Yes','$country_name')");
							// $res = mysqli_query($con, "Select distributor_id from tbl_distributor order by distributor_id desc limit 1");
							// while ($row = mysqli_fetch_assoc($res)) {
							// $temp_id = $fetchUser['distributor_id'];
							$code = 'BTCASH';

							$checkPurchaseParty = mysqli_query($con, "SELECT * FROM `tbl_purchase_party` WHERE distributor_id = '$distributor_id'");
							if (mysqli_num_rows($checkPurchaseParty) != 0) {
								$query_pparty = mysqli_query($con, "UPDATE `tbl_purchase_party` SET `bt_party_id` = '$code', `party_name` = 'Cash', `party_address` = '$place_supply', `insert_datetime` = '$regdate_date', `place_of_supply` = '$place_supply', `state_code` = '$state_code' WHERE `distributor_id` = '$distributor_id'");
							} else {
								$query_pparty = mysqli_query($con, "INSERT INTO `tbl_purchase_party`(`bt_party_id`, `party_name`, `party_address`, `insert_datetime`, `distributor_id`, `place_of_supply`, `state_code`) VALUES ('$code','Cash','$place_supply','$regdate_date','$distributor_id','$place_supply','$state_code')");
							}

							$checkParty = mysqli_query($con, "SELECT * FROM `tbl_party` WHERE distributor_id = '$distributor_id'");
							if (mysqli_num_rows($checkParty) != 0) {
								$zucol = mysqli_query($con, "UPDATE `tbl_party` SET party_name = 'Cash',party_type = 'Retailer',group_name = 'Sundry Debtors',party_address = '$place_supply',place_of_supply = '$place_supply',state_name = '$place_supply',tb_insertdatetime = '$regdate_date',tb_inserttime = '$regdate_time',status = 'Active',party_code = '$state_code' WHERE distributor_id = '$distributor_id'");
								$fetchParty = mysqli_fetch_assoc($checkParty);
								$party_id = $fetchParty['party_id'];
							} else {
								$zucol = mysqli_query($con, "INSERT INTO tbl_party (party_name,party_type,distributor_id,group_name,party_address,place_of_supply,state_name, tb_insertdatetime, tb_inserttime,status,party_code) VALUES ('Cash','Retailer','$temp_id','Sundry Debtors','$place_supply','$place_supply','$place_supply','$regdate_date','$regdate_time','Active','$state_code')");
								$party_id = mysqli_insert_id($con);
							}

							$checkUser = mysqli_query($con, "SELECT * FROM `tbl_user` WHERE distributor_id = '$distributor_id'");
							if (mysqli_num_rows($checkUser) != 0) {
								$qry_user = mysqli_query($con, "UPDATE `tbl_user` SET `user_name` = 'FOS1',`user_phone` = '$contact',`user_password` = '$contact',`user_type` = '2',`invoice_type` = 'Both',`e_recharge_setting` = 'No',`work_type` = '$business_type',`parent_group` = 'main store',`tb_insertdatetime` = '$regdate',`next_renew_date` = '$next_renew_date',`status` = 'Active' WHERE `distributor_id` = '$distributor_id'");

								$fetchUser = mysqli_fetch_assoc($checkUser);
								$temp_1 = $fetchUser['user_id'];
							} else {
								$qry_user = mysqli_query($con, "INSERT INTO `tbl_user`(`distributor_id`, `user_name`, `user_phone`, `user_password`, `user_type`, `invoice_type`, `e_recharge_setting`, `work_type`, `parent_group`, `tb_insertdatetime`, `next_renew_date`, `status`) VALUES ('$distributor_id','FOS1','$contact','$contact','2','Both','No','$business_type','main store','$regdate','$next_renew_date','Active')");
								$temp_1 = mysqli_insert_id($con);
							}

							$checkPartyUser = mysqli_query($con, "SELECT * FROM `tbl_party_user` WHERE party_id = '$party_id' AND user_id = '$temp_1'");
							if (mysqli_num_rows($checkPartyUser) == 0) {
								$query11 = mysqli_query($con, "INSERT IGNORE INTO `tbl_party_user` (party_id, user_id, insert_date) VALUES ('$party_id', '$temp_1', '$regdate_date')");
							}

							$checkDistributorUser = mysqli_query($con, "SELECT * FROM `tbl_distributor_users` WHERE distributor_id = '$distributor_id'");

							if (mysqli_num_rows($checkDistributorUser) != 0) {
								$qry11 = mysqli_query($con, "UPDATE tbl_distributor_users SET distributor_name = '$bNm',distributor_email = '$email',password = '$pass',phone_no = '$contact',image_path = '$bLogo',gstin_no = '$gst',status = 'Active',registration_datetime = '$regdate',user_role = '$user_role_val',imei_no = '$imei_no',app_login = '$app_login_val' WHERE distributor_id = '$distributor_id'");

								$fetch_distributor_user = mysqli_fetch_assoc($checkDistributorUser);
								$distributor_user_id = $fetch_distributor_user['distributor_user_id'];

							} else {
								$qry11 = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_users(distributor_id,distributor_name, distributor_email, password,phone_no, image_path, gstin_no,status,registration_datetime,user_role, imei_no,app_login) values('$distributor_id','$bNm','$email','$pass','$contact','$bLogo','$gst', 'Active','$regdate','$user_role_val','$imei_no','$app_login_val')");
								$distributor_user_id = mysqli_insert_id($con);
							}

							$checkDistTermCond = mysqli_query($con, "SELECT * FROM `tbl_dist_terms_conditions` WHERE distributor_id = '$distributor_id'");
							if (mysqli_num_rows($checkDistTermCond) != 0) {
								$qry_insert = mysqli_query($con, "UPDATE `tbl_dist_terms_conditions` SET `terms_condition1` = '$terms_id1',`terms_condition2` = '$terms_id2',`terms_condition3` = '$terms_id3',`insert_datetime` = '$regdate' WHERE `distributor_id` = '$distributor_id'");
							} else {
								$qry_insert = mysqli_query($con, "INSERT INTO `tbl_dist_terms_conditions`(`distributor_id`, `terms_condition1`, `terms_condition2`, `terms_condition3`,`insert_datetime`) VALUES ('$distributor_id','$terms_id1','$terms_id2','$terms_id3','$regdate')");
							}


							$select_circle = mysqli_query($con, "SELECT commission_rate FROM tbl_purchase_commission_master where circle_name like '%$place_supply%'");
							if (mysqli_num_rows($select_circle) > 0) {
								while ($fetch_circle = mysqli_fetch_array($select_circle)) {
									$circle_commission_rate = $fetch_circle['commission_rate'];

									$checkDistOpertMaster = mysqli_query($con, "SELECT * FROM `tbl_distributor_operator_master` WHERE distributor_id = '$distributor_id' AND commission_rate = '$circle_commission_rate'");
									if (mysqli_num_rows($checkDistOpertMaster) != 0) {
										$qry_operator = mysqli_query($con, "UPDATE `tbl_distributor_operator_master` SET `sender_id` = 'Airtel' WHERE `distributor_id` = '$distributor_id' AND `commission_rate` = '$circle_commission_rate'");
									} else {
										$qry_operator = mysqli_query($con, "INSERT INTO `tbl_distributor_operator_master`(`distributor_id`, `circle_id`, `operator_id`, `commission_rate`, `sender_id`) VALUES ('$distributor_id','1','1','$circle_commission_rate','Airtel')");
									}
								}
							} else {
								$checkDistOpertMaster = mysqli_query($con, "SELECT * FROM `tbl_distributor_operator_master` WHERE distributor_id = '$distributor_id' AND commission_rate = '0.04474'");
								if (mysqli_num_rows($checkDistOpertMaster) != 0) {
									$qry_operator = mysqli_query($con, "UPDATE `tbl_distributor_operator_master` SET `commission_rate` = '0.04474' `sender_id` = 'Airtel' WHERE `distributor_id` = '$distributor_id'");
								} else {
									$qry_operator = mysqli_query($con, "INSERT INTO `tbl_distributor_operator_master`(`distributor_id`, `circle_id`, `operator_id`, `commission_rate`, `sender_id`) VALUES ('$temp_id','1','1','0.04474','Airtel')");
								}
							}

							$check_query = mysqli_query($con, "SELECT distributor_id FROM tbl_client_service WHERE distributor_id = '$distributor_id'");

							if (mysqli_num_rows($check_query) > 0) {
								$qry_service = mysqli_query($con, "UPDATE tbl_client_service SET self_bthawk = 'Yes',auto_bthawk = 'No',itr = 'No',gst = 'No',audit = 'No',gst_registration = 'No',dsc_token = 'No',it_notice = 'No',udyog_aadhar = 'No',P2P = 'No',status = 'Active',insert_datetime = '$regdate' WHERE distributor_id = '$distributor_id'");
							} else {
								$qry_service = mysqli_query($con, "INSERT INTO `tbl_client_service`(`distributor_id`, `self_bthawk`, `auto_bthawk`, `itr`, `gst`, `audit`, `gst_registration`, `dsc_token`, `it_notice`, `udyog_aadhar`, `P2P`,`status`,`insert_datetime`)VALUES('$distributor_id', 'Yes','No','No','No','No','No','No','No','No','No','Active','$regdate')");
							}

							$check_query = mysqli_query($con, "SELECT distributor_id FROM tbl_product_category_master WHERE distributor_id = '$distributor_id'");

							if (mysqli_num_rows($check_query) > 0) {
								$query = mysqli_query($con, "UPDATE tbl_product_category_master SET category_name = 'Service',status = 'Active',insert_date = '$regdate_date',insert_time = '$regdate_time' WHERE distributor_id = '$distributor_id'");

								$fetchCategory = mysqli_fetch_assoc($query);
								$service_cat = $fetchCategory['category_id'];
							} else {
								$query = mysqli_query($con, "INSERT INTO `tbl_product_category_master`(`distributor_id`, `category_name`, `status`, `insert_date`, `insert_time`) VALUES ('$distributor_id','Service','Active','$regdate_date','$regdate_time')");
								$service_cat = mysqli_insert_id($con);
							}

							$check_query = mysqli_query($con, "SELECT category_id FROM tbl_product_subcategory_master WHERE category_id = '$service_cat'");

							if (mysqli_num_rows($check_query) > 0) {
								$query1 = mysqli_query($con, "UPDATE tbl_product_subcategory_master SET subcategory_name = 'Service',status = 'Active',insert_date = '$regdate_date',insert_time = '$regdate_time' WHERE category_id = '$service_cat'");

								$fetchSubCat = mysqli_fetch_assoc($check_query);
								$service_subcat = $fetchSubCat['subcategory_id'];
							} else {
								$query1 = mysqli_query($con, "INSERT INTO `tbl_product_subcategory_master`( `category_id`, `subcategory_name`, `status`, `insert_date`, `insert_time`) VALUES ('$service_cat','Service','Active','$regdate_date','$regdate_time')");
								$service_subcat = mysqli_insert_id($con);
							}

							if (strpos($business_type, 'Service') !== false) {
								$check = mysqli_query($con, "SELECT id FROM tbl_product WHERE distributor_id = '$distributor_id' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");

								if (mysqli_num_rows($check) > 0) {
									$insert_plan = mysqli_query($con, "UPDATE tbl_product SET product_name = 'LAPU PREPAID',product_price = '1',purchase_price = '1',CGST = '9',SGST = '9',IGST = '18',status = 'Active',tb_insertdatetime = '$regdate',product_type = 'Service',product_category = 'LAPU BALANCE',unit = 'Pcs',maintain_inventory = 'No' WHERE distributor_id = '$distributor_id' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");
								} else {
									$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,product_category,unit,maintain_inventory) VALUES ('$distributor_id','LAPU PREPAID','1','1','9','9','18','Active','$regdate','Service','$service_cat','$service_subcat','LAPU BALANCE','Pcs','No')");
								}
							}

							if (strpos($business_type, 'FMCG') !== false) {
								$check = mysqli_query($con, "SELECT id FROM tbl_product WHERE distributor_id = '$distributor_id' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");

								if (mysqli_num_rows($check) > 0) {
									$insert_plan = mysqli_query($con, "UPDATE tbl_product SET product_name = 'Bikaji Bikaneri Bhujia 1kg',product_price = '100',purchase_price = '100',CGST = '9',SGST = '9',IGST = '18',status = 'Active',tb_insertdatetime = '$regdate',product_type = 'FMCG',unit = 'Pcs',maintain_inventory = 'No' WHERE distributor_id = '$distributor_id' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");
								} else {
									$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,unit,maintain_inventory) VALUES ('$distributor_id','Bikaji Bikaneri Bhujia 1kg','100','100','9','9','18','Active','$regdate','FMCG','$service_cat','$service_subcat','Pcs','No')");
								}
							}

							if (strpos($business_type, 'Serial No') !== false) {
								$check = mysqli_query($con, "SELECT id FROM tbl_product WHERE distributor_id = '$distributor_id' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");

								if (mysqli_num_rows($check) > 0) {
									$insert_plan = mysqli_query($con, "UPDATE tbl_product SET product_name = 'Mobile Phone',product_price = '100',purchase_price = '100',CGST = '9',SGST = '9',IGST = '18',status = 'Active',tb_insertdatetime = '$regdate',product_type = 'Serial No',unit = 'Pcs',maintain_inventory = 'No' WHERE distributor_id = '$v' AND category_id = '$service_cat' AND subcategory_id = '$service_subcat'");
								} else {
									$insert_plan = mysqli_query($con, "INSERT INTO tbl_product(distributor_id, product_name, product_price, purchase_price, CGST, SGST,IGST, status, tb_insertdatetime,product_type,category_id,subcategory_id,unit,maintain_inventory) VALUES ('$distributor_id','Mobile Phone','100','100','9','9','18','Active','$regdate','Serial No','$service_cat','$service_subcat','Pcs','No')");
								}
							}

							// new code

							$dis_id = $distributor_id;
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
							echo json_encode(['status' => 1, 'data' => $returnArr, 'message' => 'Successfully Registered']);
							exit();
						}
					} else if ($checkUserStatus == 3) {
						$updateStatus = mysqli_query($con, "UPDATE `tbl_distributor` SET status = 'Active' WHERE distributor_id = '$distributor_id' AND (distributor_email = '$email' or phone_no = '$contact')");

						if ($updateStatus) {

							$dis_id = $distributor_id;
							$res_dis = mysqli_query($con, "SELECT * from `tbl_distributor` where distributor_id='$dis_id'");
							$row11 = mysqli_fetch_assoc($res_dis);
							
							$getDistributorUser = mysqli_query($con, "SELECT * FROM `tbl_distributor_users` WHERE distributor_id = '$distributor_id'");
							$fetchDistUser = mysqli_fetch_assoc($getDistributorUser);

							$distributor_user_id = $fetchDistUser['distributor_user_id'];

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

							echo json_encode(['status' => 1, 'data' => $returnArr, 'message' => 'Successfully Registered']);
							exit();
						} else {
							echo json_encode(['status' => 0, 'data' => null, 'message' => 'Registered Failed']);
							exit();
						}
					}
					// 	echo json_encode(['status' => 0, 'data' => null, 'message' => 'Successfully Registered']);
					// 	exit();

				}
			}
		} else {
			echo json_encode(['status' => 0, 'data' => null, 'message' => 'Required Fields ' . $gst . " " . $contact . " " . $name]);
			exit();
		}
	} else {
		echo json_encode(['status' => 0, 'data' => null, 'message' => 'Field missing ' . $contact . " " . $country_name]);
		exit();
	}
} else {
	echo json_encode(['status' => 0, 'data' => null, 'message' => 'Required field missing']);
	exit();
}
