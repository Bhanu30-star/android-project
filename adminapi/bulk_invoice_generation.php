<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['sdate']) && isset($_POST['edate']) && isset($_POST['billtype']))
{
	$ver=$_POST['distributor_id'];
	$partyplaceid = isset($_POST['party_id']) ? $_POST['party_id'] : '';

	$sdate=$_POST['sdate'];
	$edate=$_POST['edate'];
	$checkbilltype = $_POST['billtype'];
	$billcopy=$_POST['billTypeUser'];
	$bill_format = isset($_POST['bill_format']) ? $_POST['bill_format'] : '';
	if($checkbilltype=="Invoice")
	{
		$billtype="Tax Invoice";
	}
	else
	{
		if($checkbilltype=="Challan")
			$billtype="Delivery Challan";
		else if($checkbilltype=="Receipt")
			$billtype="Receipt";
		else $billtype='Payout';
	}
	$vb=1;
	$party_place_id='';
	if($partyplaceid!='')
	{
		$search_party=explode(",",$partyplaceid);
		for ($ik=0;$ik<count($search_party);$ik++)  
		{
			$searchpval=trim($search_party[$ik]);
			$result_val = mysqli_query($con, "select party_id from tbl_party where party_name like '$searchpval%' and distributor_id='$ver'");
			while($row_party = mysqli_fetch_array($result_val)){
				if($vb==1)
					$party_place_id=$row_party['party_id'];
				else
					$party_place_id=$party_place_id.",".$row_party['party_id'];
				$vb++;
			}
		}
	}
	if($partyplaceid=="")
		$res_txn_receipt = mysqli_query($con,"select transaction_id from tbl_party_transaction where transaction_date>='$sdate' and transaction_date<='$edate' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' order by transaction_bill_number asc");
	else
		$res_txn_receipt = mysqli_query($con,"select transaction_id from tbl_party_transaction where transaction_date>='$sdate' and transaction_date<='$edate' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' and transaction_to in ($party_place_id) order by transaction_bill_number asc");

	if(mysqli_num_rows($res_txn_receipt)<50)
	{
		$response['call_url']="https://www.bthawk.appexperts.net/admin_api/bulk_new.php?uid=".$ver."&sdate=".$sdate."&edate=".$edate."&searchparty=".base64_encode($party_place_id)."&billtype=".$checkbilltype."&lng=".$bill_format."&billcopy=".$billcopy;
		$response['success']='1';
		$response['details']="	invoice successfully Fetched!";
	}
	else
	{
		$response['success']='0';
		$response['details']="There are too many invoices therefore system takes time to download, kindly download data for single retailer or less than 30 days!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>