<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate1']) && isset($_POST['searchdate2']))
{
	$cparty=isset($_POST['cparty']) ? $_POST['cparty'] : '';
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	if($cparty!="")
	{
		$res = mysqli_query($con,"select * from tbl_distributor_transaction_charges,tbl_purchase_party where tbl_distributor_transaction_charges.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction_charges.distributor_id='$session_dist_ver' and tbl_distributor_transaction_charges.bill_date>='$cdate1' and tbl_distributor_transaction_charges.bill_date<='$cdate2' and tbl_purchase_party.party_name LIKE '".$cparty."%' and tbl_distributor_transaction_charges.tcs_amt>0 and tbl_distributor_transaction_charges.status='Complete' order by tbl_distributor_transaction_charges.transaction_id ASC");
	}
	else
	{
		$res = mysqli_query($con,"select * from tbl_distributor_transaction_charges,tbl_purchase_party where tbl_distributor_transaction_charges.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction_charges.distributor_id='$session_dist_ver' and tbl_distributor_transaction_charges.bill_date>='$cdate1' and tbl_distributor_transaction_charges.bill_date<='$cdate2' and tbl_distributor_transaction_charges.tcs_amt>0 and tbl_distributor_transaction_charges.status='Complete' order by tbl_distributor_transaction_charges.transaction_id ASC");
	}
	if(mysqli_num_rows($res)>0)
	{     
		$tcs_detail=array();
		while($fetch_data=mysqli_fetch_array($res))
		{
			$tcs_detail['Bill_No']=$fetch_data['bill_no'];
			$tcs_detail['Bill_Date']=$fetch_data['bill_date'].' '.$fetch_data['bill_time'];
			$tcs_detail['PARTY_NAME']=$fetch_data['party_name'];
			$tcs_detail['PARTY_GSTIN']=$fetch_data['gstin_no'];
			$tcs_detail['TOTAL_AMT']=$fetch_data['total_amt'];
			$tcs_detail['LABOUR_CHARGES']=$fetch_data['labour_charges'];
			$tcs_detail['FREIGHT_CHARGES']=$fetch_data['freight_charges'];
			$tcs_detail['OTHER_EXPENSES']=$fetch_data['other_expenses'];
			$tcs_detail['disc_amt']=$fetch_data['disc_amt'];
			$tcs_detail['TCS_AMT']=$fetch_data['tcs_amt'];
			$tcs_detail['NET_AMT']=$fetch_data['net_amt'];
			$response['tcs_detail'][]=$tcs_detail;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="No Data Available";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>