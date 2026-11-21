<?php
include("../../connect.php"); 
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
include('../../vendor/autoload.php');
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
    $scro = date("h:i:sa");
    $da  = date("Y-m-d");
    $scri =$da.' '.$scro;
	
	$status=$_POST["status"];
	$month=$_POST["month"];
	$gst_amount=$_POST["gst_amount"];
	$recharge_amount=$_POST["amount"];
	$taxable_amt=$recharge_amount-$gst_amount;
	$txnid=$_POST["txnid"];
	$payment_plan=$_POST["payment_plan"];
	$payment_type=$_POST["payment_type"];

	$gst_amount2=$gst_amount;
	$recharge_amount2=$recharge_amount;
	$taxable_amt2=$taxable_amt;

	
	$fetchwpq=mysqli_query($con,"SELECT  * from tbl_distributor WHERE distributor_id='$ver'");
    if($fetchwpq)
	{
		while($fetchrow=mysqli_fetch_assoc($fetchwpq))
		{
			extract($fetchrow);
			$flag=0;
			$uname=ucwords($distributor_name);
			$luemail=$distributor_email;
			$mob=$phone_no;
			$id=$distributor_id;
			$fetch_dist=mysqli_query($con,"SELECT  * from tbl_user WHERE distributor_id='$ver' and status in ('Active','Deactive')");
			$no_users=mysqli_num_rows($fetch_dist);
			$dist_zone=$Zone;
			$add=$distributor_address;
            $regtime=$next_renew_date;
            $date = strtotime($regtime);
            $h=date('h', $date);
			date_default_timezone_set('Asia/Calcutta');
			$scro = date("h:i:sa");
            $da  = date("Y-m-d");
            $scri =$da.' '.$scro;
			$month_days=$month*30;
            $r=strtotime($regtime);
            $r2= strtotime("+".$month_days." days ", $r);
            $aftmonths=date('Y-m-d h:i:sa', $r2);
			include("sendmail_recharge.php");
            $d_link="http://www.bthawk.appexperts.net/";
            $prod_name="BTHAWK";
            $m_type='recharge';

            $registration_date_of_bth=$registration_datetime;
            $gstin=$gstin_no;
            $location=$place_of_supply;

            $registration_date_of_bth2=$registration_datetime;
            $gstin2=$gstin_no;
            $location2=$place_of_supply;

			$sendmail=new SendMail();
			$res=$sendmail->rechargepayment($taxable_amt,$registration_date_of_bth,$gstin,$location,$luemail,$m_type,$uname,$prod_name,$aftmonths,$scri,$id,$d_link,$txnid,$recharge_amount,$payment_plan,$month,$mob,$dist_zone,$payment_type,$no_users,$gst_amount);
			$senderemail="bthawk@belltechnology.in";
			//$senderemail="shilpa.khandelwal@belltechnology.in";
			$sendmail=new SendMail();
			$result_admin=$sendmail->rechargepaymentadmin($taxable_amt2,$gst_amount2,$registration_date_of_bth2,$gstin2,$location2,$senderemail,$luemail,$m_type,$uname,$prod_name,$aftmonths,$scri,$id,$d_link,$txnid,$recharge_amount,$mob,$dist_zone,$payment_type);
		} 
	}
	if($res==1 and $result_admin==1)
	{
		include("../../connect.php");
		$uq=mysqli_query($con,"UPDATE tbl_distributor SET next_renew_date='$aftmonths' WHERE distributor_id='$ver'");
		$uq1=mysqli_query($con,"UPDATE tbl_user SET next_renew_date='$aftmonths' WHERE distributor_id='$ver'");
		$response['success']='1';
		$response['message']="Your subscription has been successfully renewed.<br>Thank you for trusting <b>BTHAWK+</b> to manage your business efficiently.";
	}
	else
	{
		$response['success']='0';
		$response['message']="Mail not send";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>