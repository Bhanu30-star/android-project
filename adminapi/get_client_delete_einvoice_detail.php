<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{	
	$cdate1  = $_POST['start_date'];
	$cdate2  = $_POST['end_date'];
	$session_dist_ver=$_POST['distributor_id'];
	$cparty=$_POST['searchparty'];
	$billno=$_POST['billno'];
	$sdoc_type=$_POST['doc_type'];
	$res = "select *  from tbl_party_einvoice where document_date>='$cdate1' and document_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Deleted'";
	if($cparty!="")
		$res=$res." "."and (buyer_legalname like '%$cparty%' or buyer_phone='$cparty')";
	if($billno!="")
		$res=$res." "."and document_no='$billno'";
	if($sdoc_type!="")
		$res=$res." "."and document_type='$sdoc_type'";
	$res=$res." "."order by document_no ASC";
	
	$history_detail=array();
	$total_bill_amt=0;
	$query2=mysqli_query($con,$res);
	if(mysqli_num_rows($query2)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($query2))
		{
			$total_bill_amt=$total_bill_amt+$fetch_product2['doc_item_amount'];
			$history_detail['document_type']=$fetch_product2['document_type'];
			$history_detail['document_no']=$fetch_product2['document_no'];
			$history_detail['document_date']=$fetch_product2['document_date'];
			$history_detail['buyer_detail']=$fetch_product2['buyer_legalname'].' - '.$fetch_product2['buyer_phone'];
			$history_detail['doc_item_amount']=$fetch_product2['doc_item_amount'];
			$history_detail['Irn']=$fetch_product2['Irn'];
			$history_detail['AckNo']=$fetch_product2['AckNo'];
			$history_detail['AckDt']=$fetch_product2['AckDt'];
			$history_detail['json_data']=$fetch_product2['json_data'];
			$response['history_detail'][]=$history_detail;
		}
		
	}
	else
	{
		$response['history_detail']=$history_detail;
	}
	
	$response['total_bill_amt']=strval($total_bill_amt);
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
mysqli_close($con);
echo json_encode($response);
?>