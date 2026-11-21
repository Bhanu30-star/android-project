<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include("../../connect.php");
$response = array();
if (isset($_POST['search_year']) && isset($_POST['distributor_id'])) {

	$cyear = $_POST['search_year'];

	$ver = $_POST['distributor_id'];

	require '../../vendor/autoload.php';

	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}

	$cdate11 = date("Y-m-d");

	$cdate12 = date("H:i:sa");

	// filename for export

	$res_search = mysqli_query($con, "select * from tbl_distributor where distributor_id='$ver'");

	$row_search = mysqli_num_rows($res_search);

	$a21 = mysqli_fetch_array($res_search);

	$flag_done = 1;

	if ($row_search > 0) {

		$dis_name = $a21['distributor_name'];

		$dis_email = $a21['distributor_email'];

		$check_dist_gstr = mysqli_query($con, "select * from tbl_distributor_financialyear_report where distributor_id='$ver' and financial_year='$cyear'");

		if (mysqli_num_rows($check_dist_gstr) <= 0) {

			$resd1 = mysqli_query($con, "INSERT IGNORE INTO `tbl_distributor_financialyear_report`(`distributor_id`, `financial_year`, `insert_date`, `insert_time`,`mail_count`) VALUES ('$ver','$cyear','$cdate11','$cdate12','1')");

		} else {

			while ($fetch_product = mysqli_fetch_assoc($check_dist_gstr)) {

				$mail_count_val = $fetch_product['mail_count'];

			}

			if ($mail_count_val < 3) {

				$mail_count_val = $mail_count_val + 1;

				$resd1 = mysqli_query($con, "update `tbl_distributor_financialyear_report` set `mail_count`='$mail_count_val' where distributor_id='$ver' and financial_year='$cyear'");

			}

		}

		$csv_filename1 = '../distributor_gstr_report/' . 'Financial_Turbo_Report_' . date('Y-m-d H:i:sa') . '_' . $ver . '.csv';



		$fp = fopen($csv_filename1, 'w');

		fputcsv($fp, array('S.No', 'Invoice_Period', 'Payout_Txn_Reference_Number', 'Filing_Period', 'Amount', 'GST_Amount'));

		$res3 = mysqli_query($con, "select *  from tbl_distributor_financial_turbo_detail where distributor_id='$ver' and status='Accept' and financial_year='$cyear'");

		$c = 1;

		if (mysqli_num_rows($res3) > 0) {

			while ($fetch_product2 = mysqli_fetch_assoc($res3)) {

				fputcsv($fp, array($c++, $fetch_product2['invoice_period'], $fetch_product2['payout_ref_no'], $fetch_product2['filing_period'], $fetch_product2['total_amount'], $fetch_product2['gst_amount']));

			}

		}

		fclose($fp);

		/* End GSTR1 deatil Report    */

		/*Document deatil Report    */





		$user_mail_body = "<tr><td style='padding:20px'>

		<table style='max-width:730px' align='center' bgcolor='#ffffff' border='0' cellpadding='0' cellspacing='0' width='100%'>

		<tbody>

		<tr>

		<td style='font-size:1px;line-height:1px;height:1px' colspan='3' bgcolor='#d6d6d6' height='1'>  </td>

		</tr>

		<tr>

		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>

		<td><table align='center' border='0' cellpadding='0' cellspacing='0' width='100%'>

		<tbody>

		<tr>

		<td colspan='4' height='20'>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td width='293'>&nbsp;</td>

		<td width='155'><a style='text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#6ac451'><img class='CToWUd' src='http://appexperts.net/btconnect/img/BTHAWK.png' alt='BTHAWK'></a></td>

		<td width='26'>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' height='17'>&nbsp;</td>

		</tr>

		<tr>

		<td style='min-height:1px;line-height:0px;font-size:0px' colspan='4' bgcolor='#d6d6d6' height='1'>  </td>

		</tr>

		<tr>

		<td colspan='4' height='10'>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666' colspan='2'>

		<p>Dear $dis_name</p>

		</td>

		<td width='26'>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' height='0'>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>

		Your '$cyear' Financial reports(ITR,GST and Turbo Reports) are attached with this email. 

		</td>

		<td>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' height='5'>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' height='15'>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#000;line-height:24px' colspan='2'>Best Regards,</td>

		<td>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>BTHAWK Support</td>

		<td>&nbsp;</td>

		</tr>

		<tr>

		<td width='24'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>+91-7340040171</td>

		<td>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' height='10'>&nbsp;</td>

		</tr>

		<tr>

		<td style='line-height:1px' colspan='4' bgcolor='#d6d6d6' height='1'>  </td>

		</tr>

		<tr>

		<td colspan='4' bgcolor='#f3f3f3' height='10'>&nbsp;</td>

		</tr>

		<tr>

		<td colspan='4' bgcolor='#f3f3f3'>

		<table border='0' cellpadding='0' cellspacing='0'>

		<tbody>

		<tr>

		<td width='15'>&nbsp;</td>

		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>If you have any issues, feel free to contact us at <a style='text-decoration:none;color:#ea8a00' href='mailto:support@bthawk.com' target='_blank'>support@bthawk.com</a></td>

		<td width='12'>&nbsp;</td>

		</tr>

		</tbody>

		</table>

		</td>

		</tr>

		<tr>

		<td colspan='4' bgcolor='#f3f3f3' height='10'>&nbsp;</td>

		</tr>

		</tbody>

		</table>

		</td>

		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>

		</tr>

		<tr>

		<td style='line-height:1px' colspan='3' bgcolor='#d6d6d6' height='1'>  </td>

		</tr>

		</tbody>

		</table>

		</td>

		</tr><br><br><hr>Disclaimer:This E-Mail may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, Kindly notify the sender and then delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be unlawful.

		Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or contain viruses. BTHAWK does not accept any liability for any errors, omissions, viruses or computer problems experienced by any recipient as a result of this e-mail.";

		$mail = new PHPMailer(true);

		$mail->isSMTP();

		//Set SMTP host name                          

		$mail->Host = "appexperts.net";

		//Set this to true if SMTP host requires authentication to send email

		$mail->SMTPAuth = true;

		//Provide username and password     

		$mail->Username = "bthawk@appexperts.net";

		$mail->Password = "aTTG7LcWg@7U";

		$mail->From = "bthawk@appexperts.net";

		$mail->FromName = "BTHAWK-GSTR Report";

		//If SMTP requires TLS encryption then set it

		$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

		//Set TCP port to connect to 

		$mail->Port = 587;

		$mail->CharSet = 'UTF-8';

		$res1 = mysqli_query($con, "select *  from tbl_distributor_financial_report where distributor_id='$ver' and status='Accept' and financial_year='$cyear'");

		while ($fetch_product2 = mysqli_fetch_assoc($res1)) {

			$upload_file = "../financial_itr_report/" . $fetch_product2['report_url'];

			$mail->addAttachment($upload_file);

		}

		$res2 = mysqli_query($con, "select *  from tbl_distributor_gstr_financial_report where distributor_id='$ver' and status='Accept' and financial_year='$cyear'");

		while ($fetch_product2 = mysqli_fetch_assoc($res2)) {

			$upload_file = "../financial_GSTR_report/" . $fetch_product2['report_url'];

			$mail->addAttachment($upload_file);

		}

		$mail->addAttachment($csv_filename1);



		//To address and name

		$mail->addAddress($dis_email);

		//$mail->addAddress("shilpa.khandelwal@belltechnology.in");

		//$mail->addAddress("sales@belltechnology.in");

		$mail->isHTML(true);

		$mail->Subject = "Financial Reports for " . $cyear . " - (" . $dis_name . ")";

		$mail->Body = "<i>$user_mail_body</i>";
		$mail->send();
		$response['success'] = '1';
		$response['details'] = 'Mail Send Successful';
	} else {
		$response['success'] = '0';
		$response['details'] = 'Not a Valid Distributor';
	}
} else {
	$response['success'] = '0';
	$response['details'] = 'Required Field Missing';
}
echo json_encode($response);
?>