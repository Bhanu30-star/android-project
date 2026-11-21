<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['dsr_requirement']))
{
	$ver = $_POST['distributor_id'];
	$dis_dsr_requirement=$_POST['dsr_requirement'];
	$beat_summary=array();
	if($dis_dsr_requirement=='Yes')
	{
		$res = mysqli_query($con,"SELECT tbl_party.beat_detail,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status not in ('Complete','Converted') and tbl_party_transaction.payment_mode='Credit' and tbl_party.distributor_id='$ver' and tbl_party_transaction.source in ('Web','Admin') group by tbl_party.beat_detail");
	}
	else
	{
		$res = mysqli_query($con,"SELECT tbl_party.beat_detail,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status not in ('Complete','Converted') and tbl_party_transaction.payment_mode='Credit'  and tbl_party.distributor_id='$ver' group by tbl_party.beat_detail");
	}
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$beat_summary['beat_detail']=$fetch_product['beat_detail'];
			$beat_summary['party_total_amt']=$fetch_product['party_total_amt'];
			$beat_summary['received_amount']=$fetch_product['party_received_amt'];
			$beat_summary['pending_amount']=$fetch_product['party_total_amt']-$fetch_product['party_received_amt'];
			$response['beat_summary'][]=$beat_summary;
		}
	}
	else
	{
		$response['beat_summary']=$beat_summary;
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