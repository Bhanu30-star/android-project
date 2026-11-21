<?php
ob_start();
include("../../connect.php"); 
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
include('../../vendor/autoload.php');

$response = array();
if(isset($_POST['email']))
{
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");
	$da  = date("Y-m-d");
	$emailval = $_POST['email'];

	$res_search = mysqli_query($con,"select * from tbl_distributor_users where status='Active' and (distributor_email='$emailval' || phone_no='$emailval')");
	$row_search  = mysqli_num_rows($res_search);
	$a21=mysqli_fetch_array($res_search);
	if($row_search>0)
	{
		$ver=$a21['distributor_user_id'];
		$email=$a21['distributor_email'];
		$dis_name=$a21['distributor_name'];
		$uq1=mysqli_query($con,"UPDATE tbl_distributor_users SET update_datetime='$da',password='bthawk@4321',imei_no='' where distributor_user_id='$ver'");	
		$user_mail_body="<tr><td style='padding:20px'>
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
<td width='105'><a style='text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#6ac451'><img class='CToWUd' src='https://bthawk.appexperts.net/assets/new_bthawk_logo_new.png' alt='BTHAWK'></a></td>
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
You requested that your password be reset. The new password for your Admin Panel is bthawk@4321. 
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
<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>If you have any issues, feel free to contact us at <a style='text-decoration:none;color:#ea8a00' href='mailto:sales@bthawk.com' target='_blank'>sales@bthawk.com</a></td>
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
			
			
			if($email!='')
			{
				$mail = new PHPMailer(true);
				$mail->isSMTP();
				$mail->Host = "smtp.zeptomail.in";
				$mail->Port = 587;
				$mail->SMTPSecure = "tls";
				$mail->SMTPAuth = true;
				$mail->Username = "emailappsmtp.37a9e995e8ab3fca";
				$mail->Password = "EVuKC4LqFaQE";
				$mail->SetFrom("noreply@appexperts.net");
				$mail->IsHTML(true);
				$mail->CharSet = "UTF-8";        
				$mail->SMTPOptions = array('ssl' => array(
							'verify_peer' => false,
							'verify_peer_name' => false,
							'allow_self_signed' => false
						));
				
				$mail->addAddress($email);
				$mail->isHTML(true);
				$mail->Subject = "Forgot Password";
				$mail->Body = "<i>$user_mail_body</i>";
				if($mail->send()) 
				{
					$response['success']='1';
					$response['details']="Mail send successfully";
				}
				else
				{
					$response['success']='0';
					$response['details']="Mail not send";
				}
			}
			else
			{
				$response['success']='0';
				$response['details']="Mail not send";
			}
				
			
			
	}
	else
	{
		$response['success']='0';
		$response['details']="Email and phone does not match. Please check and try again later!!!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>