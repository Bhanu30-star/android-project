<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$pid = isset($_POST['party_id']) ? $_POST['party_id'] : '';
	$start_date=$_POST['start_date'];
	$end_date= $_POST['end_date'];
	$purchasebook=array();
	$res_query = "select * from tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date >= '$start_date' and tbl_distributor_transaction.bill_date<='$end_date' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' group by tbl_distributor_transaction.unique_bill";
	if($pid!='')
		$res_query=$res_query." "."and tbl_purchase_party.party_id='$pid'";
	$res = mysqli_query($con,$res_query);
	if(mysqli_num_rows($res)>0)
	{ 
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$purchasebook['transaction_id']=$fetch_product['transaction_id'];
			$purchasebook['party_id']=$fetch_product['party_id'];
			$purchasebook['party_name']=$fetch_product['party_name'];
			$purchasebook['bill_number']=$fetch_product['unique_bill'];
			$purchasebook['bill_date']=$fetch_product['bill_date'];
			$purchasebook['message_txn_id']=$fetch_product['message_txn_id'];
			$purchasebook['quantity']=$fetch_product['quantity'];
			$purchasebook['final_net_amt']=$fetch_product['final_net_amt'];
			$purchasebook['sgst_amt']=$fetch_product['sgst_amt'];
			$purchasebook['cgst_amt']=$fetch_product['cgst_amt'];
			$purchasebook['igst_amt']=$fetch_product['igst_amt'];
			$response['purchasebook'][]=$purchasebook;
		}
	}
	else
	{
		$response['purchasebook']=$purchasebook;
	}
	$response['success']='1';
	$response['details']="Bill Successfully Fetch";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>