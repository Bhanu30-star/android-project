<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['cdate1']) && isset($_POST['cdate2']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$cdate22 = date("Y-m-d");
	
	$cdate1=isset($_POST['cdate1']) ? $_POST['cdate1'] : $cdate11;
	$cdate2=isset($_POST['cdate2']) ? $_POST['cdate2'] : $cdate22;
	$searchparty1=$_POST['searchparty'];
	$search_party=explode("-",$searchparty1);
	$party_name_val=trim($search_party[0]);
	$party_phone_val=trim($search_party[1]);
	$creditnote_detail=array();
	$query="select *,sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_credit_note_history, tbl_party where tbl_party_credit_note_history.party_id=tbl_party.party_id and tbl_party_credit_note_history.distributor_id='$session_dist_ver' and tbl_party_credit_note_history.bill_date>='$cdate1' and tbl_party_credit_note_history.bill_date<='$cdate2'";
	if($searchparty1!="")
	{
		$query=$query." "."and (tbl_party.party_name='$party_name_val' or tbl_party.party_phone='$party_phone_val')";
	}
	$query=$query." "."group by tbl_party_credit_note_history.bill_no,tbl_party_credit_note_history.unique_bill order by tbl_party_credit_note_history.bill_date desc";
	$res1 = mysqli_query($con,$query);
	if(mysqli_num_rows($res1)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res1))
		{
			extract($fetch_product1);
			$party_name=$fetch_product1['party_name'];
			$creditnote_detail['txn_date']=$transaction_date;
			$creditnote_detail['party_name']=$party_name;
			$creditnote_detail['billno']=$bill_no;
			$creditnote_detail['unique_bill']=$unique_bill;
			$creditnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$creditnote_detail['bill_amount']=round($final_bill_amt);
			$creditnote_detail['adjust_amount']=round($final_adjust_amt);
			$creditnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt);
			$creditnote_detail['credit_note_type']=$credit_note_type;
			$response['creditnote_detail'][]=$creditnote_detail;
		}
	}
	else
	{
		$response['creditnote_detail']=$creditnote_detail;
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