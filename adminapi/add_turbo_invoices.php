<?php
$response = array();
include("../../connect.php");
if(isset($_POST['distributor_oid']) && isset($_POST['distributor_id']))
{  
	$distributor_oid = $_POST['distributor_oid']; 	
	$ver = $_POST['distributor_id'];
	$party_name_val=$_POST['searchparty'];
	$party_gstinno=$_POST['gstin_no'];
	$party_place_id=$_POST['place_of_supply'];
	$party_phone_no=$_POST['phone_no'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro=date('H:i:sa');
	$mycheckdate=date('Y-m-d');
	
	$result = mysqli_query($con,"select * from tbl_party where party_name='$party_name_val' and gstin_no='$party_gstinno' and distributor_id='$ver' and status='Active'");
	if(mysqli_num_rows($result)<=0)
	{
		$insert_party=mysqli_query($con,"INSERT INTO tbl_party(party_name, party_phone, distributor_id, group_name, party_address,place_of_supply,state_name,party_code,tb_insertdatetime, status,gstin_no) VALUES ('$party_name_val','$party_phone_no','$ver','Sundry Debtors','Jaipur Rajasthan','$party_place_id','Rajasthan','08','$mycheckdate','Active','$party_gstinno');");
		
		$res_party = mysqli_query($con,"SELECT party_id FROM tbl_party where party_phone='$party_phone_no' and distributor_id='$ver' and status='Active' and gstin_no='$party_gstinno'");
		if(mysqli_num_rows($res_party)>0)
		{
			$fetch_party=mysqli_fetch_assoc($res_party);
			$pp_id1=$fetch_party['party_id'];
			$res_fse = mysqli_query($con,"SELECT user_id FROM tbl_user where distributor_id='$ver' and status='Active' limit 1");
			$fetch_fse=mysqli_fetch_assoc($res_fse);
			$fse_id=$fetch_fse['user_id'];
									
			$query11 = mysqli_query($con,"insert into tbl_party_user(party_id,user_id,insert_date)values('$pp_id1','$fse_id','$mycheckdate')");
		}
	}
	else
	{
		$fetch_party=mysqli_fetch_assoc($result);
		$pp_id1=$fetch_party['party_id'];
		$res_party_user = mysqli_query($con,"SELECT * FROM tbl_party_user where party_id='$pp_id1'");
		if(mysqli_num_rows($res_party_user)<=0)
		{
			$res_fse = mysqli_query($con,"SELECT user_id FROM tbl_user where distributor_id='$ver' and status='Active' limit 1");
			$fetch_fse=mysqli_fetch_assoc($res_fse);
			$fse_id=$fetch_fse['user_id'];
			$query11 = mysqli_query($con,"insert into tbl_party_user(party_id,user_id,insert_date)values('$pp_id1','$fse_id','$mycheckdate')");
		}
	}
	if($distributor_oid=='')
	{
		$distributor_oid="BTOID".$ver;
		$uq=mysqli_query($con,"UPDATE tbl_distributor SET oid='$distributor_oid' where distributor_id='$ver'");
	}
	
	$txnref1=$_POST['txnref'];
	$invdate1=$_POST['invdate'];
	$authodate1=$_POST['authodate'];
	$gendate1=$_POST['gendate'];
	$acceptdate1=$_POST['acceptdate'];
	$bill_month=strtoupper($_POST['getmonth']);
	$bill_year=$_POST['getyear'];
	$bill_period=$bill_month.",".$bill_year;
	$toder = $_POST['total_order'];
	$scro=date('H:i:sa');
	$mycheckdate=date('Y-m-d');
	
	$res_check_bill = mysqli_query($con,"select * from tbl_digitally_invoice where Payout_Transaction_Reference_No='$txnref1' and AR_Code='$distributor_oid' and Period='$bill_period'");
	if(mysqli_num_rows($res_check_bill)==0)
	{
		$json_a=json_decode($toder, true);     
		foreach ($json_a as $person_a)
		{
			$pcgst=$person_a['cgst_amt'];
			$psgst=$person_a['sgst_amt'];
			$pigst=$person_a['igst_amt'];
			$pamt=$person_a['total_amount'];
			$product_name=$person_a['product_name'];
			$Commission_amt=$pamt-$pcgst-$psgst-$pigst;
			$gst_amt=$pcgst+$psgst+$pigst;
			$query2=mysqli_query($con,"INSERT INTO `tbl_digitally_invoice`(`AR_Code`, `Period`, `Payout_Transaction_Reference_No`, `Payout_Type`, `Invoice_CN_No`, `Invoice_Date`, `Commission`, `Total_CGST`, `Total_SGST`, `Round_Off`, `Grand_Total`, `GST_Amt`, `Payout_Authorisation_Date`,`Invoice_Generation_Date`, `Invoice_CN_status_by_Partner`, `Invoice_acceptance_date_by_Partner`, `retailer_name`, `company_status`,`distributor_id`,`Total_IGST`,`product_name`) VALUES ('$distributor_oid','$bill_period','$txnref1','Invoice','$txnref1','$invdate1','$Commission_amt','$pcgst','$psgst','0','$pamt','$gst_amt','$authodate1','$gendate1','Pending','$invdate1','$party_name_val','Pending','$ver','$pigst','$product_name')");
		}
		if($query2)
		{
			$response['success']=1;
			$response['details']="Turbo Invoice Successfully Added!";
		}
		else
		{
			$response['success']=0;
			$response['details']="Insertion Error...!!";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Bill already exists for this payout transaction reference no and period. Please check and try again later...!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 