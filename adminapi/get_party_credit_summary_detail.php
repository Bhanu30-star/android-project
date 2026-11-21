<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$dis_dsr_requirement=$_POST['dsr_requirement'];
	$retailer_summary=array();
	if($dis_dsr_requirement=='Yes')
	{
		$res = mysqli_query($con,"SELECT *,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_party.distributor_id='$ver' group by tbl_party_transaction.transaction_to");
	}
	else
	{
		$res = mysqli_query($con,"SELECT *,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit'  and tbl_party.distributor_id='$ver' group by tbl_party_transaction.transaction_to");
	}
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$retailer_summary['party_id']=$fetch_product['transaction_to'];
			$retailer_summary['party_name']=$fetch_product['party_name'];
			$retailer_summary['party_phone']=$fetch_product['party_phone'];
			$retailer_summary['party_total_amt']=$fetch_product['party_total_amt'];
			$retailer_summary['received_amount']=$fetch_product['party_received_amt'];
			$retailer_summary['pending_amount']=$fetch_product['party_total_amt']-$fetch_product['party_received_amt'];
			$response['retailer_summary'][]=$retailer_summary;
		}
	}
	else
	{
		$response['retailer_summary']=$retailer_summary;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>