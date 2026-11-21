<?php
ob_start();
mysqli_close($con);
class SendMail 
{
// send mail user when user purchase app success.
	function rechargepayment($taxable_amt,$registration_date_of_bth,$gstin,$location,$receiver_mail,$mail_type,$user_name,$product_name,$new_renew_date,$purchase_dt_time,$user_id,$dashboard_link,$paytxid,$ramount,$payment_plan,$month,$mob,$dist_zone,$payment_type,$no_users,$gst_amount)
	{
		$total_days=$month*30;
		$headcontent='';
		if($mail_type=="recharge")
		{
			$headcontent="Thanks '$user_name' For Renewal BTHAWK Services with us, your details of Renewal are as given below:";
		}
		$time = microtime();
		$contact="http://www.belltechnology.in/";
		$t = substr($time,-4);

		$abtxid ="BTHAWKTX".$user_id."U".$t;

		$user_mail_body="<tr>
		<td style='padding:20px'>
		<table style='max-width:500px' align='center' bgcolor='#ffffff' border='0' cellpadding='0' cellspacing='0' width='100%'>
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
		<td width='155'><a style='text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#6ac451'><img class='CToWUd' src='https://bthawk.com/images/bthawk.png' alt='BTHAWK'></a></td>
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
		<p>Dear $user_name</p>
		</td>
		<td width='26'>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='0'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>
		Thanks <b>$user_name</b> for BTHAWK Services renewal,your renewal details are as given below:
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='5'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>Following are the details:</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='15'>&nbsp;</td>
		</tr>
		<tr>
		<td>&nbsp;</td>
		<td colspan='2'>
		<table border='0' cellpadding='0' cellspacing='0' width='100%'>
		<tbody>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Product Name</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$product_name</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Purchase Date and Time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$purchase_dt_time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Plan Expiry Date</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$new_renew_date</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Registered Email Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$receiver_mail</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>BTHAWK User Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$user_id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Registered Phone No</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$mob</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Zone and State</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$dist_zone</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>

		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>$product_name Transaction Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$abtxid</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>$payment_type Transaction Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$paytxid</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Plan Validity</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$month*30 Days - $total_days Days</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>

		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Renew Date and Time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$new_renew_date</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>

		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>User Licenses</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$no_users</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Registration Date Time of BTHAWK</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$registration_date_of_bth</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>GSTIN Number</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$gstin</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Business State</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$location</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Taxable Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$taxable_amt</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>GST Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$gst_amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Payment Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$ramount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		</tbody>
		</table>
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='25'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='10'>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4'>
		<table border='0' cellpadding='0' cellspacing='0' width='100%'>
		<tbody>
		<tr>
		<td width='149'>&nbsp;</td>
		<td align='center' bgcolor='#ea8a00' width='200'><a style='background:#ea8a00;color:#ffffff;font-size:17px;font-weight:normal;line-height:42px;font-family:Arial,Helvetica,sans-serif;min-height:42px;display:block;text-decoration:none' href='$dashboard_link' target='_blank'>Dashboard Login</a></td>
		<td width='149'>&nbsp;</td>
		</tr>
		</tbody>
		</table>
		</td>
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
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>$product_name Support</td>
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
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>If you have any issues, feel free to contact us at <a style='text-decoration:none;color:#ea8a00' href='mailto:$contact' target='_blank'>$contact</a></td>
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
		</tr>";
		
		
		$to = 'bthawk@appexperts.net';
		$toname='BTHAWK'; 
		$from = 'bthawk@appexperts.net'; 
		$fromName = 'BTHAWK-PAYMENT'; 

		$subject = "Next Renew date of BTHAWK Services"; 
		// Set content-type header for sending HTML email 
		$headers = "MIME-Version: 1.0" . "\r\n"; 
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n"; 
		// Additional headers 
		$headers .= 'From: '.$fromName.'<'.$from.'>' . "\r\n"; 
		$headers .= 'Cc: dy@bthawk.com' . "\r\n"; 
		 $headers .= 'Bcc: sk@bthawk.com' . "\r\n"; 
		if(mail($to, $subject, $user_mail_body, $headers)){ 
		
			ob_start();
			include("../../connect.php");
			date_default_timezone_set('Asia/Calcutta');
			$scro = date("h:i:sa");
			$da  = date("Y-m-d");
			$scri =$da.' '.$scro;
			$host= gethostname();
			$ip = gethostbyname($host);
			$mac_id=$ip;
			$time = microtime();
			$t = substr($time,-4);
			$abtxid ="BTTX".$user_id."U".$t;	

			$r=strtotime($new_renew_date);
			$month_days=$month*30;
			$r2= strtotime("-".$month_days." days ", $r);
			$beforemonths1=date('Y-m-d h:i:sa', $r2);
			$insert_transaction=mysqli_query($con,"INSERT INTO tbl_bt_transaction(bt_txn_id,transaction_date,transaction_time,distributor_id,transaction_id,transaction_amount,txn_status,txn_type,plan_type,month,distributor_renew_date,updated_renew_date,payment_type,gst_amount,source)VALUES('$abtxid','$da','$scro','$user_id','$paytxid ','$ramount','Success', 'Renew','$payment_plan','$month','$beforemonths1','$new_renew_date','$payment_type','$gst_amount','App')");
			return 1;
		}else{ 
			return $user_mail_body;
		}
		
		
	}
// send mail admin when purches app 
	function rechargepaymentadmin($taxable_amt2,$gst_amount2,$registration_date_of_bth2,$gstin2,$location2,$admin_mail,$receiver_mail,$mail_type,$user_name,$product_name,$new_renew_date,$purchase_dt_time,$user_id,$dashboard_link,$paytxid,$ramount,$mob,$dist_zone,$payment_type)
	{
		$headcontent='';
		if($mail_type=="recharge")
		{
			$headcontent="We have a renewal  '$user_name' by $product_name and received a payment Rs $ramount.";
		}
		$time = microtime();
		$t = substr($time,-4);
		$abtxid ="BTTX".$user_id."U".$t;
		$mail_body="<tr>
		<td style='padding:20px'>
		<table style='max-width:500px' align='center' bgcolor='#ffffff' border='0' cellpadding='0' cellspacing='0' width='100%'>
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
		<td width='155'><a style='text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#6ac451'><img class='CToWUd' src='https://bthawk.com/images/bthawk.png' alt='BTHAWK'></a></td>
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
		<p>Dear Team</p>
		</td>
		<td width='26'>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='0'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>
		We have a renewal  <b>$user_name</b> by $product_name and received a payment Rs $ramount.
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='5'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>Following are the Product details:</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='15'>&nbsp;</td>
		</tr>
		<tr>
		<td>&nbsp;</td>
		<td colspan='2'>
		<table border='0' cellpadding='0' cellspacing='0' width='100%'>
		<tbody>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Product Name</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$product_name</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Purchase Date And Time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$purchase_dt_time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Next Renew Date And Time</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$new_renew_date</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>User Email</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$receiver_mail</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>User Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$user_id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Phone No</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$mob</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Zone</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$dist_zone</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>$product_name Transaction Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$abtxid</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>$payment_type Transaction Id</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$paytxid</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Registration Date Time of BTHAWK</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$registration_date_of_bth2</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>GSTIN Number</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$gstin2</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>Business State</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$location2</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Taxable Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$taxable_amt2</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>GST Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$gst_amount2</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		<tr>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' height='35' width='19'>&nbsp;</td>
		<td style='color:#000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff' width='40%'>Payment Amount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		<td bgcolor='#ffffff' width='18'>&nbsp;</td>
		<td style='color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:16px' bgcolor='#ffffff'>&nbsp;$ramount</td>
		<td bgcolor='#fff' width='5'>&nbsp;</td>
		<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
		</tr>
		<tr>
		<td style='line-height:1px' colspan='9' bgcolor='#d6d6d6' height='1'>  </td>
		</tr>
		</tbody>
		</table>
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='25'>&nbsp;</td>
		</tr>
		<tr>
		<td width='24'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>
		</td>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4' height='10'>&nbsp;</td>
		</tr>
		<tr>
		<td colspan='4'>
		<table border='0' cellpadding='0' cellspacing='0' width='100%'>
		<tbody>
		<tr>
		<td width='149'>&nbsp;</td>
		<td align='center' bgcolor='#ea8a00' width='200'><a style='background:#ea8a00;color:#ffffff;font-size:17px;font-weight:normal;line-height:42px;font-family:Arial,Helvetica,sans-serif;min-height:42px;display:block;text-decoration:none' href='$dashboard_link' target='_blank'>Admin Login</a></td>
		<td width='149'>&nbsp;</td>
		</tr>
		</tbody>
		</table>
		</td>
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
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>$product_name Support</td>
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
		<table align=  ' border='0' cellpadding='0' cellspacing='0'>
		<tbody>
		<tr>
		<td width='15'>&nbsp;</td>
		<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>If you have any issues, feel free to contact us at <a style='text-decoration:none;color:#ea8a00' href='mailto:<?php echo $receiver_mail; ?>' target='_blank'>$receiver_mail</a></td>
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
		</tr>";
		
		$to = 'bthawk@appexperts.net';
		$toname='BTHAWK'; 
		$from = 'bthawk@appexperts.net'; 
		$fromName = 'BTHAWK-PAYMENT'; 

		$subject = "Next Renew date of BTHAWK Services"; 
		// Set content-type header for sending HTML email 
		$headers = "MIME-Version: 1.0" . "\r\n"; 
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n"; 
		// Additional headers 
		$headers .= 'From: '.$fromName.'<'.$from.'>' . "\r\n"; 
		$headers .= 'Cc: bthawk@belltechnology.in' . "\r\n"; 
		 //$headers .= 'Bcc: bthawk@belltechnology.in' . "\r\n"; 
		if(mail($to, $subject, $mail_body, $headers)){ 
			return 1;
		}else{ 
			return $mail_body;
		}
	}
}
?>